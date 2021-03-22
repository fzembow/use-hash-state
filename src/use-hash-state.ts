import { useCallback, useEffect, useMemo, useState } from 'react';
import { executeInitialState, getRawDataFromURL, writeDataToURL } from './utils';
import { DEFAULT_OPTIONS, UseHashStateOptions } from './defaultOptions';

// Allow function initialization
type InitialStateGenerator<T> = T | (() => T);

const useHashState = <T = any>(
  initialState: InitialStateGenerator<T>,
  givenOptions?: Partial<UseHashStateOptions<T>>,
): [T, (newData: T) => void] => {
  const {
    parse,
    dump,
    pushHistoryState,
    writeToURLDebounceMs,
    equalFn
  } = Object.assign(DEFAULT_OPTIONS, givenOptions);

  // Initialization of functions
  const updateURL = useMemo(
    () => {
      const writeFn = (data: T): void => {
        const stringData = dump(data);

        writeDataToURL(
          stringData,
          pushHistoryState
        );
      }

      // Debounce doesn't work in tests
      return writeFn;
    },
    [writeToURLDebounceMs, pushHistoryState, dump]
  );

  const [data, _setData] = useState<T>(() => {
    // Get data from hash, if valid, otherwise initialState
    const rawData = getRawDataFromURL();
    const value = parse(rawData);

    if (value === undefined) {
      // Invalid hash data, use initialState
      const initialData = executeInitialState(initialState);
      updateURL(initialData);
      return initialData;
    }

    return value;
  });
  const setData = useCallback((newData: T) => {
    if (!equalFn(data, newData)) {
      _setData(newData);
      updateURL(newData);
    }
  }, [equalFn, data, updateURL]);


  // Update data on hash change
  const handleHashChange = useCallback(() => {
    const rawData = getRawDataFromURL();
    const value = parse(rawData);

    if (value) {
      if (!equalFn(data, value)) {
        // No need to call `setData`, because it also updates the hash,
        // we only need to update the data
        _setData(value);
      }
    }
  }, [parse]);

  useEffect(() => {
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [handleHashChange]);

  return [data, setData];
}

export default useHashState;
