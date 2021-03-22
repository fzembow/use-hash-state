// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: Circular reference is ok
type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | Record<string, Json>;

export interface UseHashStateOptions<T> {
  pushHistoryState: boolean;
  // Return T for valid data, undefined for invalid data
  parse: (rawStringData: string | undefined) => T | undefined;
  dump: (data: T) => string;
  writeToURLDebounceMs: number;
  // People should do their own equality check
  // Return `true` if equal
  equalFn: (oldData: T, newData: T) => boolean;
}

export const DEFAULT_OPTIONS: UseHashStateOptions<Json> = {
  pushHistoryState: false,
  parse: rawStringData => {
    if (rawStringData === undefined) {
      return;
    }

    try {
      return JSON.parse(rawStringData);
    } catch (error) {
      console.trace('[useHashState: Default validator] Invalid JSON.');
    }
  },
  dump: JSON.stringify,
  writeToURLDebounceMs: 0,
  equalFn: (oldData, newData) => oldData === newData
};
