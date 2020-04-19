import useHashState, { JSONValidator } from '../use-hash-state';
import { renderHook, act } from '@testing-library/react-hooks';

jest.useFakeTimers();

describe('useHashState', () => {
  beforeEach(() => {
    location.hash = '#';
    jest.spyOn(console, 'warn').mockImplementation(() => jest.fn());
    jest.spyOn(history, 'replaceState').mockImplementation(() => jest.fn());
    jest.spyOn(history, 'pushState').mockImplementation(() => jest.fn());
  });

  afterEach(() => {
    (console.warn as jest.Mock).mockRestore();
    (history.replaceState as jest.Mock).mockRestore();
    (history.pushState as jest.Mock).mockRestore();
  });

  test('sets initial state if no hash', () => {
    location.hash = '';
    const initialState = {
      foo: 'bar',
    };

    const { result } = renderHook(() => useHashState(initialState));
    const { state } = result.current;
    expect(state).toEqual(initialState);
    expect(console.warn).toHaveBeenCalledTimes(0);
  });

  test('accepts valid JSON within hash', () => {
    const hashState = {
      foo: 'zoo',
    };
    const initialState = {
      foo: 'bar',
    };
    location.hash = `#${encodeURIComponent(JSON.stringify(hashState))}`;
    const { result } = renderHook(() => useHashState(initialState));
    const { state } = result.current;
    expect(state).toEqual(hashState);
    expect(console.warn).toHaveBeenCalledTimes(0);
  });

  test('rejects invalid JSON within hash', () => {
    location.hash = '#AKJSFKLASJF';
    const initialState = {
      foo: 'bar',
    };
    const { result } = renderHook(() => useHashState(initialState));
    const { state } = result.current;
    expect(state).toEqual(initialState);
    expect(console.warn).toHaveBeenCalledWith(
      'URL hash is not valid JSON, ignoring'
    );
  });

  test('rejects JSON not matching initialState keys', () => {
    const initialState = {
      foo: 'bar',
    };
    const invalidState = {
      zoo: 'bar',
    };
    location.hash = `#${encodeURIComponent(JSON.stringify(invalidState))}`;
    const { result } = renderHook(() =>
      useHashState(initialState, { validateKeysAndTypes: true })
    );
    const { state } = result.current;
    expect(state).toEqual(initialState);
    expect(console.warn).toHaveBeenNthCalledWith(
      1,
      'Object in URL hash is invalid, ignoring'
    );
    expect(console.warn).toHaveBeenNthCalledWith(2, invalidState);
  });

  test('rejects JSON not matching initialState types', () => {
    const initialState = {
      foo: 'bar',
    };
    const invalidState = {
      foo: true,
    };
    location.hash = `#${encodeURIComponent(JSON.stringify(invalidState))}`;
    const { result } = renderHook(() =>
      useHashState(initialState, { validateKeysAndTypes: true })
    );
    const { state } = result.current;
    expect(state).toEqual(initialState);
    expect(console.warn).toHaveBeenNthCalledWith(
      1,
      'Object in URL hash is invalid, ignoring'
    );
    expect(console.warn).toHaveBeenNthCalledWith(2, invalidState);
  });

  test('rejects JSON not matching custom validator', () => {
    interface State {
      foo: string;
    }
    const initialState: State = {
      foo: 'bar',
    };
    const invalidState: State = {
      foo: 'zoo',
    };
    const validator: JSONValidator = (obj): boolean => {
      if (obj['foo'] === undefined) {
        return false;
      }
      if (typeof obj['foo'] !== 'string') {
        return false;
      }
      if (!['bar', 'baz'].includes(obj['foo'])) {
        return false;
      }
      return true;
    };
    location.hash = `#${encodeURIComponent(JSON.stringify(invalidState))}`;
    const { result } = renderHook(() =>
      useHashState<State>(initialState, { customValidator: validator })
    );
    const { state } = result.current;
    expect(state).toEqual(initialState);
    expect(console.warn).toHaveBeenNthCalledWith(
      1,
      'Object in URL hash is invalid, ignoring'
    );
    expect(console.warn).toHaveBeenNthCalledWith(2, invalidState);
  });

  test('replaces history by default', () => {
    interface State {
      foo: string;
    }
    const initialState: State = {
      foo: 'bar',
    };
    const { result } = renderHook(() => useHashState<State>(initialState));
    const { state, setStateAtKey } = result.current;
    expect(state).toEqual(initialState);

    act(() => {
      setStateAtKey('foo', 'zoo');
    });

    jest.advanceTimersByTime(500);
    jest.runAllTimers();

    const expected = `/#${encodeURIComponent(JSON.stringify({ foo: 'zoo' }))}`;
    expect(history.replaceState).toHaveBeenCalledWith(undefined, '', expected);
    expect(history.pushState).toHaveBeenCalledTimes(0);
  });

  test('uses pushHistory if desired', () => {
    interface State {
      foo: string;
    }
    const initialState: State = {
      foo: 'bar',
    };
    const { result } = renderHook(() =>
      useHashState<State>(initialState, { usePushState: true })
    );
    const { state, setStateAtKey } = result.current;
    expect(state).toEqual(initialState);

    act(() => {
      setStateAtKey('foo', 'zoo');
    });

    jest.advanceTimersByTime(500);
    jest.runAllTimers();

    const expected = `/#${encodeURIComponent(JSON.stringify({ foo: 'zoo' }))}`;
    expect(history.replaceState).toHaveBeenCalledTimes(0);
    expect(history.pushState).toHaveBeenCalledWith(undefined, '', expected);
  });

  test('debounces writing to the URL', () => {
    interface State {
      foo: string;
    }
    const initialState: State = {
      foo: 'bar',
    };
    const { result } = renderHook(() => useHashState<State>(initialState));
    const { state, setStateAtKey } = result.current;
    expect(state).toEqual(initialState);

    act(() => {
      setStateAtKey('foo', 'zoo');
    });

    act(() => {
      setStateAtKey('foo', 'boo');
    });

    act(() => {
      setStateAtKey('foo', 'new');
    });

    jest.advanceTimersByTime(500);
    jest.runAllTimers();

    const expected = `/#${encodeURIComponent(JSON.stringify({ foo: 'new' }))}`;
    expect(history.replaceState).toHaveBeenCalledTimes(1);
    expect(history.replaceState).toHaveBeenCalledWith(undefined, '', expected);
    expect(history.pushState).toHaveBeenCalledTimes(0);
  });

  test('updates state when the URL hash changes', async () => {
    interface State {
      foo: string;
    }
    const initialState: State = {
      foo: 'bar',
    };
    const { result } = renderHook(() => useHashState<State>(initialState));
    const { state } = result.current;
    expect(state).toEqual(initialState);

    act(() => {
      location.hash = `#${encodeURIComponent(JSON.stringify({ foo: 'new' }))}`;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current.state.foo).toBe('new');
  });
});
