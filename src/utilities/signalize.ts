import { ReadonlySignal, sig, SignalOf } from "@ncpa0cpl/vanilla-jsx/signals";

type Rewrap<O> = O extends infer U ? {
    [K in keyof U]: U[K];
  }
  : never;

export type Designalized<O extends object> = {
  [K in keyof O]: SignalOf<O[K]>;
};

type _Signalized<O extends object> = {
  [K in keyof O]-?: ReadonlySignal<O[K]>;
};

export type Signalized<O extends object> = Rewrap<_Signalized<Designalized<O>>>;

export function signalize<O extends object>(obj: O): Signalized<O> {
  const entries = Object.entries(obj) as Array<[keyof O, O[keyof O]]>;

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i]!;
    entries[i] = [key, sig.as(value) as any];
  }

  const entriesMap = new Map(entries);

  return new Proxy(entriesMap, {
    get(entries, propName) {
      const entry = entries.get(propName as keyof O);
      if (entry) {
        return entry;
      }
      const emptySignal = sig.as(undefined);
      entries.set(propName as keyof O, emptySignal as any);
      return emptySignal;
    },
    ownKeys(target) {
      return [...target.keys()] as any;
    },
    has() {
      return true;
    },
  }) as any;
}
