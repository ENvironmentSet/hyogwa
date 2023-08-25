import { Effectful } from './core';

export function map<E, A, B>(f: (a: A) => B, computation: Effectful<E, A>): Effectful<E, B>
export function map<A, B>(f: (a: A) => B): <E>(computation: Effectful<E, A>) => Effectful<E, B>
export function map<E, A, B>(f: (a: A) => B, computation?: Effectful<E, A>)
  : Effectful<E, B> | (<E>(computation: Effectful<E, A>) => Effectful<E, B>) {
  if (!computation) return function* (computation) { return f(yield* computation) }
  else return (function* () { return f(yield* computation) })()
}

export function* of<T>(value: T): Effectful<never, T> {
  return value
}

export function ap<E, A, B>(wrappedF: Effectful<E, (a: A) => B>, computation: Effectful<E, A>): Effectful<E, B>
export function ap<E1, A, B>(wrappedF: Effectful<E1, (a: A) => B>)
  : <E2>(computation: Effectful<E2, A>) => Effectful<E1 | E2, B>
export function ap<E, A, B>(wrappedF: Effectful<E, (a: A) => B>, computation?: Effectful<E, A>)
  : Effectful<E, B> | (<E2>(computation: Effectful<E2, A>) => Effectful<E | E2, B>) {
  if (!computation) return function* (computation) {
    const f = yield* wrappedF
    const a = yield* computation

    return f(a)
  }
  else return (function* () {
    const f = yield* wrappedF
    const a = yield* computation

    return f(a)
  })()
}

export function chain<E, A, B>(f: (a: A) => Effectful<E, B>, computation: Effectful<E, A>): Effectful<E, B>
export function chain<E1, A, B>(f: (a: A) => Effectful<E1, B>)
  : <E2>(computation: Effectful<E2, A>) => Effectful<E1 | E2, B>
export function chain<E, A, B>(f: (a: A) => Effectful<E, B>, computation?: Effectful<E, A>)
  : Effectful<E, B> | (<E2>(computation: Effectful<E2, A>) => Effectful<E | E2, B>) {
  if (!computation) return function* (computation) {
    const a = yield* computation

    return yield* f(a)
  }
  else return (function* () {
    const a = yield* computation

    return yield* f(a)
  })()
}

export const effectful = {
  map,
  of,
  ap,
  chain
}