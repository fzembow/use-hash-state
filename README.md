# use-hash-state

Hook to read and write React state from the URL hash

```tsx
// https://my-app#{hello:"world"}

const {
  state: { hello },
} = useHashState({});
// hello === "world"
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

# Usage

```tsx
const { state, setStateAtKey } = useHashState(initialState, options);
```

## Parameters

### `initialState`

(type: `{}`)

The state to start with, also used to determine what is considered a valid URL state by default (see the `validateKeysAndTypes` option below for more).

### `options`

See [Options argument](#options-argument) below

## Return values

### `state`

The current state, preferentially taken from the URL.

### `setStateAtKey`

(type: `(key: keyof T, value: any) => void`)

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

  const { state, setStateAtKey } = useHashState(initialState);

  const handleIncrement = () => {
    setStateAtKey('count', state.count + 1);
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

As **Increment** is clicked, `setStateAtKey` updates the state within the component, and the URL will be updated to reflect the internal state.

Reloading or sharing the link will cause the `initialState` to be ignored, in favor of the URL state.

# Options argument

Options may be passed as the second argument to `useHashState`:

```tsx
import useHashState, { UseHashStateOptions } from 'use-hash-state';

const MyComponent = () => {
  const initalState = {};

  const options: UseHashStateOptions = {
    usePushState: true, // boolean | undefined
    validateKeysAndTypes: true, // boolean | undefined
    customValidator: (obj: {}) => {
      return true;
    }, // (obj: {}) => boolean | undefined
  };

  const { state, setStateAtKey } = useHashState(initialState, options);

  // ...
};
```

### `usePushState`

(type: `boolean | undefined`, default: `false`)

By default, `useHashState` uses `history.replaceState` to update the URL. This means that the back and forward buttons will ignore the URL updates made by this hook, which is suitable for quickly-updating state when you do not want a massively long history.

If you set `usePushState` to `true`, the hook will use `history.pushState`, so every state update will add a new history entry, and you will be able to use the browser next / previous buttons to access previous states.

### `validateKeysAndTypes`

(type: `boolean | undefined`, default: `true`)

When `validateKeysAndTypes` is set to `true` (the default), the hook will check that any object in the URL has the same keys as the `initialState` that you provide, and that the values at those keys are also the same types as in `initialState`. If the URL state is not the same shape, it will be ignored, and the initial state will be applied.

This is handy for ensuring that your component state does not get super crazy because of some malformed URLs, particularly when you are developing and changing the shape of your state often.

### `customValidator`

(type: `(obj: {}) => boolean | undefined`, default: `undefined`)

If you have a more complicated state that you'd like to validate, provide a `customValidator`, which will be passed the JSON object parsed from the URL. Return `true` if that object should be read into the local state, `false` otherwise.

This is useful for when you want to ensure that values have certain bounds.

Note that this is applied _in addition to_ basic key and type validation if `validateKeysAndTypes` is set to `true`.

# License

MIT
