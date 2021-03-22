# use-hash-state

Hook to read and write React state from the URL hash

```tsx
// https://my-app#{hello:"world"}

const [state, setState] = useHashState({});
// state === { hello: "world" }
```

## Why?

For simple demos and proofs of concepts, it often suffices to store state in the client, without a database.

URLs are a good place to store data:

- URLs are "serverless"
- URLs can be bookmarked
- URLs are easily shareable
- Browser back and forward buttons allow accessing state over time

This hook is not a router, it merely synchronizes the state within a component with state stored in the URL.

I would not use this for any production system, but it's invaluable for sharing ideas with colleagues.

# Installation

```shell
npm install --save use-hash-state
```

or

```shell
yarn add use-hash-state
```

# Usage

```tsx
const [state, setState] = useHashState(initialState, options);
```

## Parameters

### `initialState`

(type: `T`)

The state to start with. The `initialState` is used it the url is not valid (see [parse](#parse)), or is empty.

### `options`

See [Options argument](#options-argument) below

## Return values

### `state`

The current state, preferentially taken from the URL.

### `setState`

(type: `T`)

Updates the state at a particular key, also updating the URL.

---

In a simple counter component:

```tsx
import React from 'react';
import useHashState from 'use-hash-state';

const Counter = () => {
  const initialState = {
    count: 0,
  };

  const [ state, setState ] = useHashState(initialState);

  const handleIncrement = () => {
      setState({
          count: state.count + 1
      });
  };

  return (
    <>
      <span>Count: {state.count}</span>
      <button onClick={handleIncrement}>Increment</button>
    </>
  );
};
```

Upon load, the URL hash will be set to the URL-encoded JSON representation of the initial state:

```
http://localhost:1234/#%7B%22count%22%3A2%7D
```

As **Increment** is clicked, `setState` updates the state within the component, and the URL will be updated to reflect the internal state.

Reloading or sharing the link will cause the `initialState` to be ignored, in favor of the URL state.

# Options argument

Options may be passed as the second argument to `useHashState`:

```tsx
import useHashState, { UseHashStateOptions } from 'use-hash-state';

const MyComponent = () => {
  const initalState = {};

  // Default values
  const options: UseHashStateOptions = {
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

  const { state, setStateAtKey } = useHashState(initialState, options);

  // ...
};
```

### `pushHistoryState`

(type: `boolean`, default: `false`)

By default, `useHashState` uses `history.replaceState` to update the URL. This means that the back and forward buttons will ignore the URL updates made by this hook, which is suitable for quickly-updating state when you do not want a massively long history.

If you set `usePushState` to `true`, the hook will use `history.pushState`, so every state update will add a new history entry, and you will be able to use the browser next / previous buttons to access previous states.

### `parse`

(type: `(rawStringData: string | undefined) => T | undefined`, default: `[ Function ]`)

This function parses the raw string given in the URL. 

If data is invalid, return `undefined`, this will indicate to use the `initialState`. 

### `dump`

(type: `(data: T) => string`, default: `JSON.stringify`)

This function should dump the data to a `string`. This will be the hash in the URL.


### `writeToURLDebounceMs`

**Currently unavailable**

Parameter for the `debounce` function.

### `equalFn`

(type: `(oldData: T, newData: T) => boolean`, default: `(oldData, newData) => oldData === newData`)

This function is used to check whether the URL or the state has changed.
As you can see, there library **does not** deep check (so objects and arrays won't work out of the box).

You can use [fast-deep-equal](https://github.com/epoberezkin/fast-deep-equal) for example for deep equality checks.

# License

MIT
