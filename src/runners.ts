import { Effects, Code, HandleTactics, handle, run } from './core';
import { Eq, Simplify } from './utils';

export { run } from './core'

type ToplevelHandlers<E extends Effects, R = never>
  = Simplify<
  E extends Code<`${infer S}.${infer C}`, infer P, infer ER> ?
    Eq<P, never> extends false ?
      { [K in S]: { [K in C]: (...parameters: [...P, HandleTactics<ER, R>]) => void } }
      : { [K in S]: { [K in C]: ER } }
    : never
>

export function unsafeRunSync<E extends Effects, R>(computation: Generator<E, R>, handlers: ToplevelHandlers<E, R>): R {
  //@ts-ignore-next-line
  return run(handle(computation, handlers))
}

export function unsafeRunAsync<E extends Effects, R>(computation: Generator<E, R>, handlers: ToplevelHandlers<E, R>): Promise<R> {
  function unsafeAsyncRunner(resumeValue: unknown): Promise<R> {
    return new Promise(resolve => {
      const raised = computation.next(resumeValue)

      if (raised.done) return resolve(raised.value)

      const { construction, parameters } = raised.value
      const [ scope, constructorName ] = construction.split('.')

      if (typeof handlers[scope]![constructorName] === 'function')
        handlers[scope]![constructorName](...parameters, {
          resume(value) {
            resolve(unsafeAsyncRunner(value))
          },
          abort(value) {
            resolve(value)
          }
        })
      else
        resolve(unsafeAsyncRunner(handlers[scope]![constructorName]))
    })
  }

  return unsafeAsyncRunner(undefined)
}