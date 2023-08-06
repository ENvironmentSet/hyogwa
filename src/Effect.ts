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

type ActionFromSpec<S extends Spec>
  = Exclude<keyof S, typeof EFFECT_NAME> extends infer K ?
      K extends keyof S ?
        Action<S[typeof EFFECT_NAME], K, S[K] extends (...args: infer P) => unknown ? P : never>
        : never
      : never

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

type Effect<S extends Spec> = {
  [K in Exclude<keyof S, typeof EFFECT_NAME>]: S[K] extends (...args: infer P) => infer R ? (...args: P) => Effectful<S, R> : Effectful<S, S[K]>
} & S[typeof EFFECT_NAME]

export type Derive<N extends string, S extends Spec> = Omit<S, typeof EFFECT_NAME> & { [EFFECT_NAME]: `${N}` }

interface EffectConstructor {
  new <S extends Spec>(name: S[typeof EFFECT_NAME]): Effect<S>
}

export const Effect: EffectConstructor = (function (effectName: string) {
  const base = {
    [Symbol.toPrimitive]: () => effectName
  }

  return new Proxy(base, {
    get(_, constructorName) {
      //@ts-ignore-next-line
      const result = function* (...parameters) {
        //@ts-ignore-next-line
        return yield { effectName, constructorName, parameters }
      }

      //@ts-ignore-next-line
      result[Symbol.iterator] = function* () {
        //@ts-ignore-next-line
        return yield { effectName, constructorName }
      }

      return result
    }
  })
}) as any // this is OK

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

export function run<R>(comp: Effectful<never, R>): R {
  return comp.next().value
}

export function unsafeRunSync<E extends Spec, R>(comp: Effectful<E, R>, handlers: TotalHandlersFromSpecs<E>): R {
  return run(handle(comp, handlers))
}

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