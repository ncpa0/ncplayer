import {
  MaybeReadonlySignal,
  sig,
  Signal,
} from "@ncpa0cpl/vanilla-jsx/signals";

export class LocalValue<T> {
  protected value!: T;

  constructor(public readonly key: string, initV: T) {
    const stored = localStorage.getItem(key);
    if (stored != null) {
      try {
        this.value = JSON.parse(stored);
      } catch (err) {
        console.error(err);
        this.set(initV);
      }
    } else {
      this.set(initV);
    }
  }

  get() {
    return this.value;
  }

  set(v: T) {
    this.value = v;
    localStorage.setItem(this.key, JSON.stringify(v));
  }
}

export class LocalSignal<T> extends LocalValue<T> {
  private _signal: Signal<T>;
  readonly signal;

  constructor(
    k: string,
    initV: T,
    protected opts: {
      enabled: MaybeReadonlySignal<boolean | undefined>;
    },
  ) {
    super(k, initV);
    this._signal = sig<T>(this.get());
    this.signal = this._signal.readonly();
  }

  override set(s: T) {
    if (
      this.opts.enabled === true
      || (this.opts?.enabled && this.opts.enabled.get())
    ) {
      super.set(s);
    } else {
      this.value = s;
    }
    this._signal.dispatch(s);
  }
}
