import { Effects, Code, HandleTactics, handle, run, Effectful, HandleError } from './core';
import { Eq, Simplify, UnionToIntersection } from './utils';

export { run } from './core'

/**
 * Constructs type for handlers used at top level
 *
 * @internal
 *
 * @typeParam E - Effects to handle
 * @typeParam R - Result type of handling operation
 */
type ToplevelHandlers<E extends Effects, R = never>
  = Simplify<
      UnionToIntersection<
        E extends Code<`${infer S}.${infer C}`, infer P extends unknown[], infer ER> ?
          Eq<P, never> extends false ?
            { [K in S]: { [K in C]: (...parameters: [...P, HandleTactics<ER, R>]) => void } }
            : { [K in S]: { [K in C]: ER } }
          : never
      >
>

/**
 * Runs given computation synchronously
 *
 * @param computation - A computation to evaluate
 * @param handlers - Handlers to handle whole effect of given computation
 *
 * @example
 *
 * ```typescript
 * unsafeRunSync(computationToRun, handlers)
 * ```
 */
export function unsafeRunSync<E extends Effects, R>(computation: Effectful<E, R>, handlers: ToplevelHandlers<E, R>): R {
  //@ts-ignore-next-line
  return run(handle(computation, handlers))
}

type UnsafeToplevelAsyncHandlers<E extends Effects, R = never>
  = Simplify<
  UnionToIntersection<
    E extends Code<`${infer S}.${infer C}`, infer P extends unknown[], infer ER> ?
      Eq<P, never> extends false ?
        { [K in S]: { [K in C]: (...parameters: [...P, HandleTactics<ER, R>]) => void } }
        : { [K in S]: { [K in C]: Promise<ER> } }
      : never
  >
>

/**
 * Runs given computation asynchronously
 *
 * Handlers passed to this function can call handle tactics asynchronously.
 *
 * @param computation - A computation to evaluate
 * @param handlers - Handlers to handle whole effect of given computation
 *
 * @example
 *
 * ```typescript
 * unsafeRunAsync(computationToRun, handlers)
 * ```
 */
export function unsafeRunAsync<E extends Effects, R>(computation: Effectful<E, R>, handlers: UnsafeToplevelAsyncHandlers<E, R>): Promise<R> {
  function unsafeAsyncRunner(resumeValue: unknown): Promise<R> {
    return new Promise(resolve => {
      const raised = computation.next(resumeValue)

      if (raised.done) return resolve(raised.value)

      const { construction, parameters } = raised.value
      const [ scope, constructorName ] = construction.split('.')
      let isCodeHandled = false

      //@ts-ignore-next-line
      if (typeof handlers[scope][constructorName] === 'function')
        //@ts-ignore-next-line
        handlers[scope][constructorName](...parameters, {
          resume(value: unknown) {
            if (isCodeHandled) throw new HandleError(raised.value, 'cannot call handle tactics more than once')

            resolve(unsafeAsyncRunner(value))
            isCodeHandled = true
          },
          abort(value: R) {
            if (isCodeHandled) throw new HandleError(raised.value, 'cannot call handle tactics more than once')

            resolve(value)
            isCodeHandled = true
          }
        })
      //@ts-ignore-next-line
      else resolve(Promise.resolve(handlers[scope][constructorName]).then(unsafeAsyncRunner))
    })
  }

  return unsafeAsyncRunner(undefined)
}