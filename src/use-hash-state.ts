import { useRef, useState, useEffect } from 'react';
import { debounce } from 'ts-debounce';
import { setsAreEqual } from './utils';

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [prop: string]: Json };

type JsonMap = { [prop: string]: Json };

export interface JSONValidator {
  (obj: JsonMap): boolean;
}

interface UseHashStateOptions {
  usePushState?: boolean;
  validateKeysAndTypes?: boolean;
  customValidator?: JSONValidator;
}

const DEFAULT_OPTIONS: UseHashStateOptions = {
  usePushState: false,
  validateKeysAndTypes: true,
};

const DEBOUNCE_WRITE_URL_MS = 100;

const parseStateFromUrl = <T extends {}>(
  validator?: JSONValidator
): T | undefined => {
  const hash = window.location.hash.slice(1);
  if (!hash) {
    return;
  }

  try {
    const obj = JSON.parse(decodeURIComponent(hash));
    if (!obj) {
      return;
    }
    if (validator) {
      if (validator(obj)) {
        return obj as T;
      } else {
        console.warn('Object in URL hash is invalid, ignoring');
        console.warn(obj);
      }
    } else {
      return obj as T;
    }
  } catch (e) {
    console.warn('URL hash is not valid JSON, ignoring');
    // JSON parsing failed
  }
  return undefined;
};

const writeStateToUrl = debounce((newState: {}, usePushState = false): void => {
  const json = JSON.stringify(newState);
  const { title } = document;
  const url = `${window.location.pathname}#${encodeURIComponent(json)}`;
  if (usePushState) {
    history.pushState(undefined, title, url);
  } else {
    history.replaceState(undefined, title, url);
  }
}, DEBOUNCE_WRITE_URL_MS);

const getKeysAndTypesValidator = <T extends {}>(
  initialState: T
): JSONValidator => {
  const initialStateKeys = new Set(Object.keys(initialState));
  const initialStateTypes: { [key: string]: string } = {};
  for (const key in initialState) {
    initialStateTypes[key] = typeof initialState[key];
  }

  return (obj: {}): boolean => {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const dict = obj as { [key: string]: object };
    if (!setsAreEqual(initialStateKeys, new Set(Object.keys(dict)))) {
      return false;
    }

    const objKeys = Object.keys(dict);
    for (let i = 0; i < objKeys.length; i++) {
      const key = objKeys[i];
      const value = dict[key];
      const keyType = typeof value;
      if (keyType !== initialStateTypes[key]) {
        return false;
      }
    }
    return true;
  };
};

const buildValidator = <T extends {}>(
  initialState: T,
  validateKeysAndTypes?: boolean,
  customValidator?: JSONValidator
): JSONValidator => {
  const validators: JSONValidator[] = [];
  if (validateKeysAndTypes) {
    validators.push(getKeysAndTypesValidator<T>(initialState));
  }
  if (customValidator) {
    validators.push(customValidator);
  }
  return (obj: {}): boolean => validators.every((v) => v(obj));
};

const useHashState = <T extends {}>(
  initialState: T,
  options?: UseHashStateOptions
): {
  state: T;
  setStateAtKey: (key: keyof T, value: {}) => void;
} => {
  const {
    usePushState = false,
    validateKeysAndTypes = true,
    customValidator,
  } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const didRender = useRef<boolean>(false);

  let initialValidator: JSONValidator | undefined;
  if (!didRender.current) {
    initialValidator = buildValidator(
      initialState,
      validateKeysAndTypes,
      customValidator
    );

    // Synchronously check the URL hash on the first render,
    // so that the state returned to the caller is the URL state
    // if one is defined.
    const parsedState = parseStateFromUrl<T>(initialValidator);
    if (parsedState) {
      initialState = parsedState;
    } else if (initialState) {
      writeStateToUrl(initialState, usePushState);
    }
    didRender.current = true;
  }

  const validatorRef = useRef<JSONValidator | undefined>(initialValidator);
  const [state, setState] = useState<T>(initialState);

  useEffect(() => {
    validatorRef.current = buildValidator(
      initialState,
      validateKeysAndTypes,
      customValidator
    );
  }, [initialState, validateKeysAndTypes, customValidator]);

  const onHashChange = (): void => {
    const parsedState = parseStateFromUrl<T>(validatorRef.current);
    if (parsedState) {
      setState(parsedState);
    }
  };

  useEffect(() => {
    window.addEventListener('hashchange', onHashChange);
    return (): void => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const setStateAtKey = (key: keyof T, value: {}): void => {
    setState((prevState) => {
      const newState = {
        ...prevState,
        [key]: value,
      };

      writeStateToUrl(newState, usePushState);
      return newState;
    });
  };

  return { state, setStateAtKey };
};

export default useHashState;
