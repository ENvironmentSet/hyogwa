import { Effectful } from './core';

/**
 * Applies function to result of a computation.
 *
 * @beta
 *
 * @param f - A function to apply
 * @param computation - A computation whose result will be applied
 * @returns A computation mapped by `f`
 */
export function map<E, A, B>(f: (a: A) => B, computation: Effectful<E, A>): Effectful<E, B>
/**
 * Lifts given function to work with effectful computations instead of plain values
 *
 * @beta
 *
 * @param f - A function to lift
 * @returns lifted function
 */
export function map<A, B>(f: (a: A) => B): <E>(computation: Effectful<E, A>) => Effectful<E, B>
export function map<E, A, B>(f: (a: A) => B, computation?: Effectful<E, A>)
  : Effectful<E, B> | (<E>(computation: Effectful<E, A>) => Effectful<E, B>) {
  if (!computation) return function* (computation) { return f(yield* computation) }
  else return (function* () { return f(yield* computation) })()
}

/**
 * Makes computation of the given value
 *
 * @beta
 *
 * @param value
 * @returns pure computation only producing the given value
 */
export function* of<T>(value: T): Effectful<never, T> {
  return value
}

/**
 * Applies function inside effectful computation to result of another computation.
 *
 * @beta
 *
 * @param wrappedF - An effectful computation wrapping a function
 * @param computation - An effectful computation whose result will be applied
 */
export function ap<E, A, B>(wrappedF: Effectful<E, (a: A) => B>, computation: Effectful<E, A>): Effectful<E, B>
/**
 * Unwrap function inside effectful computation as function for effectful computations.
 *
 * @beta
 *
 * @param wrappedF - A function to unwrap
 * @returns an unwrapped function for effectful computations.
 */
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

/**
 * Applies effectful function to effectful computation
 *
 * @beta
 *
 * @param f - An effectful function to apply
 * @param computation - An effectful computation to be applied
 */
export function chain<E, A, B>(f: (a: A) => Effectful<E, B>, computation: Effectful<E, A>): Effectful<E, B>
/**
 * Lifts effectful function to be function of effectful computations
 *
 * @beta
 *
 * @param f - An effectful function to lift
 */
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