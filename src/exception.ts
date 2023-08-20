import { createCodeConstructors, Effect, Handlers } from './core';

/**
 * Effect spec template for exception effects (similar to 'Either' or 'Result' monads)
 *
 * @alpha
 *
 * @typeParam T - A type of value representing error
 */
export interface Exception<T> {
  raise(representation: T): never
}

/**
 * Simple implementation of exception effect where string represents error and error representation can be omitted
 *
 * @alpha
 */
export type SimpleException = Effect<'SimpleException', Exception<string | void>>
/**
 * Simple implementation of exception effect where string represents error and error representation can be omitted
 *
 * @alpha
 */
export const SimpleException = createCodeConstructors<SimpleException>('SimpleException')
/**
 * Unsafe handlers for 'SimpleException'
 *
 * @alpha
 */
export const unsafeSimpleExceptionHandlers = {
  SimpleException: {
    raise(representation) {
      throw representation
    }
  }
} satisfies Handlers<SimpleException>