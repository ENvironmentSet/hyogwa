import { UnionToIntersection } from './UnionToIntersection'

const EFFECT_NAME: unique symbol = Symbol.for('hyogwa/effect-name')

/**
 * This type has two different meaning:
 * 1. Base type for effect specification types
 * 2. Type of Types which includes every possible effect specification types (i.e. Kind of effect specification types)
 *
 * (second one is possible thanks to subtype polymorphism)
 */
export interface Spec<N extends string = string> {
  [EFFECT_NAME]: N
}

/**
 * Type of Actions(Effectful terms/codes/operations)
 *
 * Parameterized by name of the effect where the action belongs('EN'), name of the action constructor('CN')
 * and type of parameters the action requires('P')
 */
interface Action<EN, CN, P> {
  effectName: EN
  constructorName: CN
  parameters: P
}

type PickActionNames<S extends Spec> = Exclude<keyof S, typeof EFFECT_NAME>

type ActionFromSpec<S extends Spec>
  = PickActionNames<S> extends infer K ?
      K extends keyof S ?
        Action<S[typeof EFFECT_NAME], K, S[K] extends (...args: infer P) => unknown ? P : never>
        : never
      : never

/** ActionFromSpec iterating over union of specs */
type ActionsFromSpecs<S extends Spec>
  = S extends infer S_ ?
      S_ extends Spec ?
        ActionFromSpec<S_>
        : never
      : never

/**
 * Type of effectful computation
 *
 * Parameterized by spec of effects('S') and evaluation result type('R').
 * It's possible to provide multiple effect spec by combining specs via union.
 *
 * Theoretically, Effectful computation is Generator object that...
 *
 * 1. May yield arbitrary number of actions.
 * 2. Must return computation result of type 'R' as return value.
 */
export interface Effectful<S extends Spec, R> extends Generator<ActionsFromSpecs<S>, R> {
  [Symbol.iterator](): Effectful<S, R>
}

/**
 * Type of Effect
 *
 * Takes an effect spec and returns actual representation of that effect
 */
type Effect<S extends Spec> = {
  [K in PickActionNames<S>]: S[K] extends (...args: infer P) => infer R ? (...args: P) => Effectful<S, R> : Effectful<S, S[K]>
}

/**
 * Type utility for deriving new effect from another
 */
export type Derive<N extends string, S extends Spec> = Omit<S, typeof EFFECT_NAME> & { [EFFECT_NAME]: `${N}` }

/**
 * Effect constructor
 *
 * Given an effect specification as type argument and an effect name as actual argument,
 * returns an actual effect representation. Actual effect representation contains action constructors.
 */
export function createEffect<S extends Spec>(effectName: S[typeof EFFECT_NAME]): Effect<S> {
  return new Proxy({}, {
    // Property accesses which have passed type check are always access to action creators
    get(_, constructorName) {
      // Action creator for function effects
      //@ts-ignore-next-line
      const result = function* (...parameters) {
        //@ts-ignore-next-line
        return yield { effectName, constructorName, parameters }
      }

      // Action creator for value effects
      //@ts-ignore-next-line
      result[Symbol.iterator] = function* () {
        //@ts-ignore-next-line
        return yield { effectName, constructorName }
      }

      return result
    }
  }) as Effect<S>
}
//@TODO: make this function only require spec of new effect

/**
 * Produce handler type definition for given effect(specification)
 */
type HandlerFromSpec<S extends Spec> = {
  [K in Exclude<keyof S, typeof EFFECT_NAME>]:
    S[K] extends (...args: infer P) => infer R ?
      ((...args: [...P, (result: R) => never]) => void) | ((...args: [...P, (result: R) => never]) => Effectful<Spec, R>)
      : S[K] | Effectful<Spec, S[K]>
}

type HandlersFromSpecs<S extends Spec>
  = UnionToIntersection<
      S extends infer S_ ?
        S_ extends Spec ?
          { [K in S_[typeof EFFECT_NAME]]?: HandlerFromSpec<S> }
          : never
        : never
    >

type TotalHandlersFromSpecs<S extends Spec>
  = UnionToIntersection<
  S extends infer S_ ?
    S_ extends Spec ?
      { [K in S_[typeof EFFECT_NAME]]: HandlerFromSpec<S> }
      : never
    : never
>

/**
 * Collects used effects from given handler(type)
 */
type CollectEffectsFromHandlers<H>
  = keyof H extends infer K1 ?
      K1 extends keyof H ?
        keyof H[K1] extends infer K2 ?
          K2 extends keyof H[K1] ?
            H[K1][K2] extends () => Effectful<infer E, unknown> ?
              E
              : H[K1][K2] extends Effectful<infer E, unknown> ?
                  E
                  : never
            : never
          : never
        : never
      : never

/**
 * Resolves some effects of given computation by attaching handlers
 */
export function* handle<E extends Spec, R, H extends HandlersFromSpecs<E>>(computation: Effectful<E, R>, handlers: H)
// those were type of parameters, following is return type
  : Effectful<Exclude<E, { [EFFECT_NAME]: keyof H }> | CollectEffectsFromHandlers<H>, R> {
  let thrown = computation.next()
  let flag = true

  while (!thrown.done && flag) {
    const action = thrown.value
    flag = false

    // @ts-ignore-next-line
    if (action.effectName in handlers && action.constructorName in handlers[action.effectName]) {
      // @ts-ignore-next-line
      if (typeof handlers[action.effectName][action.constructorName] !== 'function') {
        // @ts-ignore-next-line
        thrown = computation.next(handlers[action.effectName][action.constructorName])
        flag = true
      } else {
        // @ts-ignore-next-line
        const maybeComputation = handlers[action.effectName][action.constructorName](...action.parameters, value => (flag = true, thrown = computation.next(value)))

        if (typeof maybeComputation === 'object' && maybeComputation !== null && Symbol.iterator in maybeComputation)
          yield* maybeComputation
      }
    } else {
      thrown = computation.next(yield action)
      flag = true
    }
  }

  return thrown.value
} // TOTAL MESS

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
export function unsafeRunSync<E extends Spec, R>(comp: Effectful<E, R>, handlers: TotalHandlersFromSpecs<E>): R {
  return run(handle(comp, handlers))
}

/**
 * Given any effectful computation and handlers that resolves every possible effects of that computation,
 * run the computation asynchronously. Handlers given to this function are allowed to call 'resume' any time.
 *
 * NOTE: handlers must not produce new (hyogwa) effects since it's not possible to set more handlers after this function
 * NOTE: this is UNSAFE since it doesn't check whether given handlers are valid or not
 */
export function unsafeRunAsync<E extends Spec, R>(comp: Effectful<E, R>, handlers: TotalHandlersFromSpecs<E>): Promise<R> {
  function unsafeAsyncRunner(comp: Effectful<E, R>, nextVal: unknown): Promise<R> {
    return new Promise((resolve, reject) => {
      const thrown = comp.next(nextVal)

      if (thrown.done) return resolve(thrown.value)

      const { effectName, constructorName, parameters } = thrown.value

      //@ts-ignore-next-line
      if (effectName in handlers && constructorName in handlers[effectName])
        // @ts-ignore-next-line
        if (typeof handlers[effectName][constructorName] !== 'function') computation.next(handlers[action.effectName][action.constructorName])
        //@ts-ignore-next-line
        else handlers[effectName][constructorName](...parameters, value => {
          resolve(unsafeAsyncRunner(comp, value))
        })
      else reject(new Error('Unhandled Action found'))
    })
  }

  return unsafeAsyncRunner(comp, undefined)
}