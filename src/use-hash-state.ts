import { useRef, useState } from 'react';

const parseState = <T extends object>(): T | undefined => {
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

const saveState = (newState: unknown): void => {
  const json = JSON.stringify(newState);
  history.replaceState(
    undefined,
    document.title,
    window.location.pathname + '#' + encodeURIComponent(json)
  );
};

const useHashState = <T extends object>(
  initialState: T
): [T, (key: keyof T, value: unknown) => void] => {
  const didRender = useRef<boolean>(false);

  if (!didRender.current) {
    const parsedState = parseState<T>();
    if (parsedState) {
      initialState = parsedState;
    } else if (initialState) {
      saveState(initialState);
    }
    didRender.current = true;
  }

  const [state, setState] = useState<T>(initialState);

  const setStateAtKey = (key: keyof T, value: unknown): void => {
    setState(prevState => {
      const newState = {
        ...prevState,
        [key]: value,
      };
      saveState(newState);
      return newState;
    });
  };

  return [state, setStateAtKey];
};

export default useHashState;
