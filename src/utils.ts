export const setsAreEqual = (
  setA: Set<unknown>,
  setB: Set<unknown>
): boolean => {
  if (setA.size !== setB.size) {
    return false;
  }
  const diff = new Set(setB);
  setA.forEach((item) => {
    diff.delete(item);
  });
  return diff.size === 0;
};
