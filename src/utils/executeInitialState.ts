const executeInitialState = <T>(
  initialState: (T | (() => T))
): T => {
  if (typeof initialState === "function") {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore: I don't know why...
    return initialState();
  }
  return initialState;
}

export default executeInitialState;
