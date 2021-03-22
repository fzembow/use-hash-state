import useHashState from '../use-hash-state';
import { renderHook, act } from '@testing-library/react-hooks';
import deepEqual from "fast-deep-equal";

describe('useHashState', () => {
  // Solution from https://stackoverflow.com/a/57612297/9878135
  delete window.location;
  window = Object.create(window);
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  window.location = {
    // Required fields for this library
    hostname: 'localhost',
    hash: "",
  };

  const expectHashToEqual = (expectedState: any): void => {
    const hash = window.location.hash.slice(1);
    const decodedData = decodeURIComponent(hash);
    const actualState = JSON.parse(decodedData);

    expect(actualState).toEqual(expectedState);
  }

  beforeEach(() => {
    window.location.hash = "#";
    location.hash = '#';
    jest.spyOn(console, 'warn').mockImplementation(() => jest.fn());
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    jest.spyOn(history, 'replaceState').mockImplementation((x, y, url: string) => {
      window.location.hash = "#" + url.split("#")[1];
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    jest.spyOn(history, 'pushState').mockImplementation((x, y, url: string) => {
      window.location.hash = "#" + url.split("#")[1];
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sets initial state if no hash', () => {
    location.hash = '';
    const initialState = {
      foo: 'bar',
    };

    const { result } = renderHook(() => useHashState(initialState));
    const [state] = result.current;
    expect(state).toEqual(initialState);
    expectHashToEqual(initialState);
  });

  test('accepts valid JSON', () => {
    const hashState = {
      foo: 'zoo',
    };
    const initialState = {
      foo: 'bar',
    };
    location.hash = `#${encodeURIComponent(JSON.stringify(hashState))}`;
    const { result } = renderHook(() => useHashState(initialState));
    const [state] = result.current;
    expect(state).toEqual(hashState);
    expectHashToEqual(hashState);
  });

  test('rejects invalid JSON', () => {
    location.hash = '#AKJSFKLASJF';
    const initialState = {
      foo: 'bar',
    };
    const { result } = renderHook(() => useHashState(initialState));
    const [state] = result.current;
    expect(state).toEqual(initialState);
    expectHashToEqual(initialState);
  });

  test('uses custom validator if return type is not undefined', () => {
    const value = "Invalid_Json";
    location.hash = "#" + value;
    const initialState = {
      foo: 'bar',
    };
    const { result } = renderHook(() => useHashState(initialState, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      parse: () => value,
      dump: () => value,
    }));
    const [state] = result.current;
    expect(state).toEqual(value);

    // Custom test because it's not json
    const hash = window.location.hash.slice(1);
    expect(hash).toBe(value);
  });

  test('uses initialState if custom parser returns undefined', () => {
    const value = "#NotValidJson";
    location.hash = value;
    const initialState = {
      foo: 'bar',
    };
    const { result } = renderHook(() => useHashState(initialState, {
      parse: () => undefined,
    }));
    const [state]  = result.current;
    expect(state).toEqual(initialState);
    expectHashToEqual(initialState);
  });

  test("updates url on change", () => {
    const initialState = {
      foo: 'bar',
    };
    const newState = {
      foo: 'zoo',
    };
    const { result } = renderHook(() => useHashState(initialState));
    const [state, setState] = result.current;
    expect(state).toEqual(initialState);
    expectHashToEqual(initialState);

    act(() => {
      setState(newState);
    })

    expectHashToEqual(newState);
  })

  test("updates url on change and uses pushHistory if desired", () => {
    const initialState = {
      foo: 'bar',
    };
    const newState = {
      foo: 'zoo',
    };
    const { result } = renderHook(() => useHashState(initialState, {
      pushHistoryState: true,
      equalFn: deepEqual
    }));
    const [state, setState] = result.current;
    expect(state).toEqual(initialState);
    expectHashToEqual(initialState);

    act(() => {
      setState(newState);
    })

    expect(result.current[0]).toEqual(newState);
    expectHashToEqual(newState);

    expect(history.replaceState).toHaveBeenCalledTimes(0);
    // 1 initial call + 1 setState call
    expect(history.pushState).toHaveBeenCalledTimes(1 + 1);
  })

  test('updates state when the URL hash changes', () => {
    interface State {
      foo: string;
    }
    const initialState: State = {
      foo: 'bar',
    };
    const { result } = renderHook(() => useHashState<State>(initialState));
    const [state]  = result.current;
    expect(state).toEqual(initialState);

    act(() => {
      location.hash = `#${encodeURIComponent(JSON.stringify({ foo: 'new' }))}`;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current[0].foo).toBe('new');
  });
});
