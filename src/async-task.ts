import { createPrimitives, Effect, Effectful, HandleTactics } from './core';
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
const _AsyncTask = <R>() => createPrimitives<AsyncTask<R>>('AsyncTask')
export const AsyncTask = {
  /**
   * 'await' in hyogwa's style
   *
   * @beta
   *
   * @typeParam R - result type of asynchronous task
   * @param promise - a promise to way
   */
  * wait<R>(promise: Promise<R>): Effectful<AsyncTask<R>, R> {
    return yield* _AsyncTask<R>().wait(promise)
  }
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