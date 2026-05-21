import { NCPlayerContext } from "../player";

export class EventController {
  constructor(protected context: NCPlayerContext) {}

  on<E extends Event>(
    event: keyof DocumentEventMap,
    cb: (event: E) => void,
    target?: "document" | "window",
    options?: AddEventListenerOptions,
  ): void;
  on<E extends Event>(
    event: string,
    cb: (event: E) => void,
    target?: "document" | "window",
    options?: AddEventListenerOptions,
  ): void;
  on(
    event: string,
    cb: (event: Event) => void,
    target: "document" | "window" = "window",
    options?: AddEventListenerOptions,
  ): void {
    const targetElem = target === "window" ? window : document;
    targetElem.addEventListener(event, cb, options);
    this.context.cleanup(() =>
      targetElem.removeEventListener(event, cb, options)
    );
  }
}
