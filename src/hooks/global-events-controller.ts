export type GlobalEventController = ReturnType<typeof useGlobalEventController>;

export function useGlobalEventController(cleanups: Array<Function>) {
  function on<E extends Event>(
    event: keyof DocumentEventMap,
    cb: (event: E) => void,
    target?: "document" | "window",
  ): void;
  function on<E extends Event>(
    event: string,
    cb: (event: E) => void,
    target?: "document" | "window",
  ): void;
  function on(
    event: string,
    cb: (event: Event) => void,
    target: "document" | "window" = "window",
  ): void {
    const targetElem = target === "window" ? window : document;
    targetElem.addEventListener(event, cb);
    cleanups.push(() => targetElem.removeEventListener(event, cb));
  }

  return {
    on,
  };
}
