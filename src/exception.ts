import { Spec, createEffect, Handlers } from './core';

export interface Exception<T, N extends string> extends Spec<N> {
  raise(representation: T): never
}

export interface SimpleException extends Exception<string | undefined, 'SimpleException'> {}
export const SimpleException = createEffect<SimpleException>('SimpleException')
export const unsafeSimpleExceptionHandler = {
  SimpleException: {
    raise(representation) {
      throw representation
    }
  }
} satisfies Handlers<SimpleException>