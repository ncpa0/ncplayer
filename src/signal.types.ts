export type DispatchFunc<T> = (current: T) => T;
export type SignalListener<T> = (value: T) => void;
export type SignalListenerReference<T> = Readonly<{
  /**
   * Detach the listener from the signal.
   */
  detach(): void;
  /**
   * The listener that was attached to the signal.
   */
  callback: SignalListener<unknown>;
  /**
   * The signal that the listener was attached to.
   */
  signal: ReadonlySignal<T>;
}>;

export interface ReadonlySignal<T> {
  /**
   * Add a listener to the signal. The listener will be called immediately with
   * the current value, and on every subsequent dispatch, until the listener is
   * detached.
   */
  add(listener: SignalListener<T>): SignalListenerReference<T>;
  /**
   * Get the current value of the signal.
   */
  current(): T;
  /**
   * Get the number of listeners attached to the signal.
   */
  listenerCount(): number;
  /**
   * Create a new readonly signal that derives its value from this signal.
   */
  derive<U>(getDerivedValue: (current: T) => U): ReadonlySignal<U>;
  /**
   * Detach all listeners from the signal.
   */
  detachAll(): void;
  /**
   * Completely destroy the signal. This will detach all listeners, destroy
   * all derived signals, prevent any new listeners from being added, and
   * prevent any new dispatches from being made.
   */
  destroy(): void;
}

export interface Signal<T> extends ReadonlySignal<T> {
  /**
   * Updates the value of the signal, and if the value has changed notifies
   * all listeners and derived signals.
   */
  dispatch(value: T | DispatchFunc<T>): void;
}

export type DerivableSignal<T> = Signal<T> | ReadonlySignal<T>;

export interface SignalConstructor {
  <T>(value: T): Signal<T>;
  derive: typeof derive;
  startBatch(): void;
  commitBatch(): void;
}

declare function derive<E, U>(
  sig1: DerivableSignal<E>,
  getDerivedValue: (v1: E) => U,
): ReadonlySignal<U>;
declare function derive<E, F, U>(
  sig1: DerivableSignal<E>,
  sig2: DerivableSignal<F>,
  getDerivedValue: (v1: E, v2: F) => U,
): ReadonlySignal<U>;
declare function derive<E, F, G, U>(
  sig1: DerivableSignal<E>,
  sig2: DerivableSignal<F>,
  sig3: DerivableSignal<G>,
  getDerivedValue: (v1: E, v2: F, v3: G) => U,
): ReadonlySignal<U>;
declare function derive<E, F, G, H, U>(
  sig1: DerivableSignal<E>,
  sig2: DerivableSignal<F>,
  sig3: DerivableSignal<G>,
  sig4: DerivableSignal<H>,
  getDerivedValue: (v1: E, v2: F, v3: G, v4: H) => U,
): ReadonlySignal<U>;
declare function derive<E, F, G, H, I, U>(
  sig1: DerivableSignal<E>,
  sig2: DerivableSignal<F>,
  sig3: DerivableSignal<G>,
  sig4: DerivableSignal<H>,
  sig5: DerivableSignal<I>,
  getDerivedValue: (v1: E, v2: F, v3: G, v4: H, v5: I) => U,
): ReadonlySignal<U>;
declare function derive<E, F, G, H, I, J, U>(
  sig1: DerivableSignal<E>,
  sig2: DerivableSignal<F>,
  sig3: DerivableSignal<G>,
  sig4: DerivableSignal<H>,
  sig5: DerivableSignal<I>,
  sig6: DerivableSignal<J>,
  getDerivedValue: (v1: E, v2: F, v3: G, v4: H, v5: I, v6: J) => U,
): ReadonlySignal<U>;

declare const sig: SignalConstructor;

export { sig };
