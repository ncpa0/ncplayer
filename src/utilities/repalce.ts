export function replace<T>(
  arr: T[],
  idx: number,
  value: T | ((oldValue: T) => T),
): T[] {
  const arrCopy = [...arr];
  if (!(idx in arrCopy)) {
    return arrCopy;
  }
  if (typeof value === "function") {
    arrCopy[idx] = (value as ((oldValue: T) => T))(arrCopy[idx]!);
  } else {
    arrCopy[idx] = value;
  }
  return arrCopy;
}
