import { useRef, useState, useEffect } from 'react';
import { debounce } from 'ts-debounce';

interface UseHashStateOptions {
  usePushState?: boolean;
}

const DEBOUNCE_WRITE_URL_MS = 250;

const parseStateFromUrl = <T extends object>(): T | undefined => {
  const hash = window.location.hash.slice(1);
  if (!hash) {
    return;
  }

  try {
    return JSON.parse(decodeURIComponent(hash));
  } catch (e) {
    return undefined;
  }
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

const useHashState = <T extends object>(
  initialState: T,
  { usePushState }: UseHashStateOptions = { usePushState: false }
): [T, (key: keyof T, value: unknown) => void] => {
  const didRender = useRef<boolean>(false);

  // Synchronously check the URL hash on the first render
  if (!didRender.current) {
    const parsedState = parseStateFromUrl<T>();
    if (parsedState) {
      initialState = parsedState;
    } else if (initialState) {
      writeStateToUrl(initialState, usePushState);
    }
    didRender.current = true;
  }

  const [state, setState] = useState<T>(initialState);

  const onHashChange = (): void => {
    const parsedState = parseStateFromUrl<T>();
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

  return [state, setStateAtKey];
};

export default useHashState;
