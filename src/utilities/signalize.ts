import { ReadonlySignal, sig, VSignal } from "@ncpa0cpl/vanilla-jsx";
import { MaybeSignal } from "../player.component";

type Rewrap<O> = O extends infer U ? {
    [K in keyof U]: U[K];
  }
  : never;

type TypeOfMaybeSignal<M extends MaybeSignal<any>> = Extract<
  M,
  ReadonlySignal<any>
> extends ReadonlySignal<any> ? ReturnType<
    Extract<
      M,
      ReadonlySignal<any>
    >["current"]
  >
  : never;

export type Designalized<O extends object> = {
  [K in keyof O]: ReadonlySignal<any> extends O[K] ? TypeOfMaybeSignal<O[K]>
    : O[K];
};

type _Signalized<O extends object> = {
  [K in keyof O]-?: ReadonlySignal<O[K]>;
};

export type Signalized<O extends object> = Rewrap<_Signalized<Designalized<O>>>;

export function signalize<O extends object>(obj: O): Signalized<O> {
  const entries = Object.entries(obj) as Array<[keyof O, O[keyof O]]>;

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i]!;
    if (value instanceof VSignal) {
      continue;
    }

    entries[i] = [key, sig(value) as any];
  }

  const entriesMap = new Map(entries);

  return new Proxy(entriesMap, {
    get(entries, propName) {
      const entry = entries.get(propName as keyof O);
      if (entry) {
        return entry;
      }
      const emptySignal = sig(undefined);
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
