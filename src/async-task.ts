import { Effect, Effectful, HandleTactics, createPrimitive } from './core';
import { unsafeRunAsync } from './runners';

/**
 * Effect for computations rely on asynchronous tasks
 *
 * @beta
 *
 * @typeParam R - result type of asynchronous task
 */
export type AsyncTask<R = unknown> = Effect<'AsyncTask', {
  wait(promise: Promise<R>): R
}>
export const AsyncTask = {
  /**
   * 'await' in hyogwa's style
   *
   * @beta
   *
   * @typeParam R - result type of asynchronous task
   * @param promise - a promise to way
   */
  wait: createPrimitive('AsyncTask', 'wait') as <R>(promise: Promise<R>) => Effectful<AsyncTask<R>, R>
}

/**
 * Convert given effectful computation to promise
 *
 * @param computation - A computation to transform
 * @returns same computation but represented as promise
 */
export function promisify<R>(computation: Effectful<AsyncTask, R>): Promise<R> {
  return unsafeRunAsync(computation, {
    AsyncTask: {
      async wait<PR>(promise: Promise<PR>, { resume }: HandleTactics<PR, R>) {
        resume(await promise)
      }
    }
  })
}