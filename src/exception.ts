import { createCodeConstructors, Effect, Handlers } from './core';

/**
 * Effect spec template for exception effects (similar to 'Either' or 'Result' monads)
 *
 * @beta
 *
 * @typeParam T - A type of value representing error
 *
 * @example Setting 'NaN' as fallback for division
 *
 * ```typescript
 * import { Effect, createCodeConstructors, Effectful, handle, run } from 'hyogwa/core'
 * import { Exception } from 'hyogwa/exception'
 *
 * type DivideByZero = Effect<'DivideByZero', Exception<void>>
 * const DivideByZero = createCodeConstructors<DivideByZero>('DivideByZero')
 *
 * function* div(x, y): Effectful<DivideByZero, number> {
 *   if (y === 0) yield* DivideByZero.raise()
 *
 *   return x / y
 * }
 *
 * function main(): Effectful<never, number> {
 *   const result = yield* handle(
 *     div(1, 0),
 *     {
 *       DivideByZero: {
 *         raise(_, { abort }) {
 *           abort(NaN)
 *         }
 *       }
 *     }
 *   )
 *
 *   return result
 * }
 *
 * run(main())
 * ```
 */
export interface Exception<T> {
  raise(representation: T): never
}

/**
 * Simple implementation of exception effect where string represents error and error representation can be omitted
 *
 * @beta
 */
export type SimpleException = Effect<'SimpleException', Exception<string | void>>
/**
 * Simple implementation of exception effect where string represents error and error representation can be omitted
 *
 * @beta
 */
export const SimpleException = createCodeConstructors<SimpleException>('SimpleException')
/**
 * Unsafe handlers for 'SimpleException'
 *
 * @beta
 */
export const unsafeSimpleExceptionHandlers = {
  SimpleException: {
    raise(representation) {
      throw representation
    }
  }
} satisfies Handlers<SimpleException>