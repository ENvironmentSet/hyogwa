import { Effectful, handle, Spec, HandlersFromSpecs } from './Effect';

/**
 * runs any pure computation
 */
export function run<R>(comp: Effectful<never, R>): R {
  return comp.next().value
}

/**
 * Given any effectful computation and handlers that resolves every possible effects of that computation,
 * run the computation synchronously.
 *
 * NOTE: handlers must not produce new (hyogwa) effects since it's not possible to set more handlers after this function
 * NOTE: this is UNSAFE since it doesn't check whether given handlers are valid or not
 */
export function unsafeRunSync<E extends Spec, R>(comp: Effectful<E, R>, handlers: HandlersFromSpecs<E>): R {
  return run(handle(comp, handlers))
}

/**
 * Given any effectful computation and handlers that resolves every possible effects of that computation,
 * run the computation asynchronously. Handlers given to this function are allowed to call 'resume' any time.
 *
 * NOTE: handlers must not produce new (hyogwa) effects since it's not possible to set more handlers after this function
 * NOTE: this is UNSAFE since it doesn't check whether given handlers are valid or not
 */
export function unsafeRunAsync<E extends Spec, R>(comp: Effectful<E, R>, handlers: HandlersFromSpecs<E>): Promise<R> {
  function unsafeAsyncRunner(comp: Effectful<E, R>, nextVal: unknown): Promise<R> {
    return new Promise((resolve, reject) => {
      const thrown = comp.next(nextVal)

      if (thrown.done) return resolve(thrown.value)

      const { effectName, constructorName, parameters } = thrown.value

      //@ts-ignore-next-line
      if (effectName in handlers && constructorName in handlers[effectName])
        // @ts-ignore-next-line
        if (typeof handlers[effectName][constructorName] !== 'function')
          // @ts-ignore-next-line
          resolve(unsafeRunAsync(comp, handlers[action.effectName][action.constructorName]))
        //@ts-ignore-next-line
        else handlers[effectName][constructorName](
          // @ts-ignore-next-line
          ...parameters,
          // @ts-ignore-next-line
          value => {
            resolve(unsafeAsyncRunner(comp, value))
          })
      else reject(new Error('Unhandled Action found'))
    })
  }

  return unsafeAsyncRunner(comp, undefined)
}