import { useRef, useState, useEffect } from 'react';
import { debounce } from 'ts-debounce';
import { setsAreEqual } from './utils';

interface StateObject {
  [key: string]: object;
  [key: number]: object;
}

interface ObjectValidator<T extends {}> {
  (obj: StateObject): obj is T;
}

interface UseHashStateOptions<T extends {}> {
  usePushState?: boolean;
  validateKeysAndTypes?: boolean;
  customValidator?: ObjectValidator<T>;
}

const DEBOUNCE_WRITE_URL_MS = 100;

const parseStateFromUrl = <T extends {}>(
  customValidator?: (obj: StateObject) => obj is T
): T | undefined => {
  const hash = window.location.hash.slice(1);
  if (!hash) {
    return;
  }

  try {
    const obj = JSON.parse(decodeURIComponent(hash));
    if (customValidator) {
      if (customValidator(obj)) {
        return obj;
      } else {
        console.warn('Object in URL hash is invalid, ignoring');
        console.warn(obj);
      }
    } else {
      return obj as T;
    }
  } catch (e) {
    // JSON parsing failed
  }
  return undefined;
};

const writeStateToUrl = debounce(
  (newState: unknown, usePushState = false): void => {
    const json = JSON.stringify(newState);
    const { title } = document;
    const url = `${window.location.pathname}#${encodeURIComponent(json)}`;
    if (usePushState) {
      history.pushState(undefined, title, url);
    } else {
      history.replaceState(undefined, title, url);
    }
  },
  DEBOUNCE_WRITE_URL_MS,
  {
    isImmediate: true,
  }
);

const getKeysAndTypesValidator = <T extends {}>(
  initialState: T
): ObjectValidator<T> => {
  const initialStateKeys = new Set(Object.keys(initialState));
  const initialStateTypes: { [key: string]: string } = {};
  for (const key in initialState) {
    initialStateTypes[key] = typeof initialState[key];
  }

  return (obj: StateObject): obj is T => {
    if (!setsAreEqual(initialStateKeys, new Set(Object.keys(obj)))) {
      return false;
    }

    const objKeys: Array<keyof typeof obj> = Object.keys(obj);
    for (let i = 0; i < objKeys.length; i++) {
      const key = objKeys[i];
      const keyType = typeof obj[key];
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
  customValidator?: ObjectValidator<T>
): ObjectValidator<T> => {
  const validators: ObjectValidator<T>[] = [];
  if (validateKeysAndTypes) {
    validators.push(getKeysAndTypesValidator<T>(initialState));
  }
  if (customValidator) {
    validators.push(customValidator);
  }
  return (obj: StateObject): obj is T => validators.every((v) => v(obj));
};

const useHashState = <T extends {}>(
  initialState: T,
  {
    usePushState,
    validateKeysAndTypes,
    customValidator,
  }: UseHashStateOptions<T> = { usePushState: false }
): {
  state: T;
  setState: React.Dispatch<React.SetStateAction<T>>;
  setStateAtKey: (key: keyof T, value: unknown) => void;
} => {
  const didRender = useRef<boolean>(false);

  let initialValidator: ObjectValidator<T> | undefined;
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

  const [validator, setValidator] = useState<ObjectValidator<T> | undefined>(
    initialValidator
  );
  const [state, setState] = useState<T>(initialState);
  useEffect(() => {
    setValidator(
      buildValidator(initialState, validateKeysAndTypes, customValidator)
    );
  }, [initialState, validateKeysAndTypes, customValidator]);

  const onHashChange = (): void => {
    const parsedState = parseStateFromUrl<T>(validator);
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

  const setStateAtKey = (key: keyof T, value: unknown): void => {
    setState((prevState) => {
      const newState = {
        ...prevState,
        [key]: value,
      };

      writeStateToUrl(newState, usePushState);
      return newState;
    });
  };

  return {state, setState, setStateAtKey};
};

export default useHashState;
