export function callLimit<A extends any[]>(
  fn: (...args: A) => void,
  timeLimit: number,
) {
  let canInvoke = true;

  return (...args: A) => {
    if (canInvoke) {
      canInvoke = false;
      setTimeout(() => {
        canInvoke = true;
      }, timeLimit);
      fn.apply(null, args);
    }
  };
}
