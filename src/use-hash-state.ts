import { useRef, useState } from 'react';
import { debounce } from "ts-debounce";

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

const writeStateToUrl = debounce((newState: unknown): void => {
  const json = JSON.stringify(newState);
  history.replaceState(
    undefined,
    document.title,
    window.location.pathname + '#' + encodeURIComponent(json)
  );
}, undefined, {
  isImmediate: true
});

const useHashState = <T extends object>(
  initialState: T
): [T, (key: keyof T, value: unknown) => void] => {
  const didRender = useRef<boolean>(false);

  // Synchronously check the URL hash on the first render
  if (!didRender.current) {
    const parsedState = parseStateFromUrl<T>();
    if (parsedState) {
      initialState = parsedState;
    } else if (initialState) {
      writeStateToUrl(initialState);
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
      writeStateToUrl(newState);
      return newState;
    });
  };

  return [state, setStateAtKey];
};

export default useHashState;
