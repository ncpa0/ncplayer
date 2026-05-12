export type GlobalEventController = ReturnType<typeof useGlobalEventController>;

export function useGlobalEventController(cleanups: Array<Function>) {
  function on<E extends Event>(
    event: keyof DocumentEventMap,
    cb: (event: E) => void,
    target?: "document" | "window",
    options?: AddEventListenerOptions,
  ): void;
  function on<E extends Event>(
    event: string,
    cb: (event: E) => void,
    target?: "document" | "window",
    options?: AddEventListenerOptions,
  ): void;
  function on(
    event: string,
    cb: (event: Event) => void,
    target: "document" | "window" = "window",
    options?: AddEventListenerOptions,
  ): void {
    const targetElem = target === "window" ? window : document;
    targetElem.addEventListener(event, cb, options);
    cleanups.push(() => targetElem.removeEventListener(event, cb, options));
  }

  return {
    on,
  };
}
