import { Eq, UnionToIntersection, Delay, Simplify, isGenerator, Unreachable } from './utils';

/**
 * Constructor for types of values representing code
 *
 * @internal
 *
 * @typeParam C - The name of construction (a string literal type is expected)
 * @typeParam P - Types of code's parameters (a never type or tuple type is expected)
 * @typeParam T - Type of code represented
 */
interface Code<C extends string, P extends unknown[], T> { // Here, unknown[] means arbitrary-length tuple type
  construction: C
  parameters: P
  type: T // This field doesn't exist at runtime. Only for holding phantom type parameter 'T'
}

/**
 * Effect type constructor
 *
 * With the name and spec of the new effect, constructs type representing the effect
 *
 * @alpha
 *
 * @typeParam N - The name of the new effect (a string literal type is expected)
 * @typeParam S - The specification of the new effect
 */
export type Effect<N extends string, S extends {}>
  = Delay<
      keyof S extends infer K ?
        K extends string & keyof S ?
          Code<
            `${N}.${K}`,
            S[K] extends (...parameters: infer P) => unknown ? P : never,
            S[K] extends (...parameters: never) => infer R ? R : S[K]
          >
          : never
      : Unreachable
    >

/**
 * Supertype of every effects
 *
 * Only for constraining type parameters, do not use this type to directly type something.
 *
 * @alpha
 */
export type Effects = Code<string, unknown[], unknown>

/**
 * Constructor of type representing effectful computation
 *
 * With given effects 'E' and type of evaluation result value 'R',
 * constructs type of effectful computations that may produce arbitrary number of effects specified in type 'E'
 * and result in value of type 'R'
 *
 * @alpha
 *
 * @privateRemarks
 *
 * To help the type inference, naked 'Generator' type is used in some places.
 * But the concern that using 'Effectful' for input parameters may disturb type inference has little basis,
 * After some investigation this type might be used in all the places.
 * And that's might be great for users and library authors.
 *
 * @typeParam E - Union of effect types that the computation may raise
 * @typeParam R - Type of evaluation result value
 */
export interface Effectful<E, R> extends Generator<E, R> {}

/**
 * Constructs collection of code constructors for given effect
 *
 * @internal
 *
 * @privateRemarks
 *
 * For some reason, typescript narrows type assigned to type parameter when distributed union is involved.
 * 'E_' exists to protect 'E' from narrowing.
 *
 * @typeParam E - An effect to derive code constructors
 * @typeParam E_ - Same type as 'E'
 */
type _CodeConstructors<E extends Effects, E_ extends Effects>
  = UnionToIntersection<
      E_ extends Code<`${infer _}.${infer C}`, infer P, infer R> ?
        Eq<P, never> extends true ?
          { [K in C]: Effectful<E, R> }
          : { [K in C]: (...parameters: P) => Effectful<E, R> }
        : never
    >

/**
 * Constructs collection of code constructors for given effect
 *
 * @internal
 *
 * @privateRemarks
 *
 * Wrapped version of '_CodeConstructors'. Use this instead of '_CodeConstructors'.
 *
 * @typeParam E - An effect to derive code constructors
 */
type CodeConstructors<E extends Effects>
  = Simplify<_CodeConstructors<E, E>>

/**
 * Extract name of effect from type level representation of effect
 *
 * @internal
 *
 * @typeParam E - An effect to extract name
 */
type NameOfEffect<E extends Effects> = E['construction'] extends `${infer N}.${infer _}` ? N : never

/**
 * Creates code constructors for given effect
 *
 * @alpha
 *
 * @param effectName - the name of given effect
 * @returns code constructors for given effect
 */
export function createCodeConstructors<E extends Effects>(effectName: NameOfEffect<E>): CodeConstructors<E> {
  return new Proxy({}, {
    get(_, constructorName: string) {
      //@ts-ignore-next-line
      const constructor = function* (...parameters) {
        //@ts-ignore-next-line
        return yield { construction: `${effectName}.${constructorName}`, parameters }
      }

      //@ts-ignore-next-line
      constructor[Symbol.iterator] = function* () {
        //@ts-ignore-next-line
        return yield { construction: `${effectName}.${constructorName}` }
      }

      return constructor
    }
  }) as CodeConstructors<E>
}

/**
 * Interface for handle tactics
 *
 * @internal
 *
 * @typeParam ER - Evaluation result type of currently handled code
 * @typeParam R - Result type of whole handling operation
 */
interface HandleTactics<in ER, in R> {
  resume(value: ER): void
  abort(value: R): void
}

/**
 * Constructs type of value to handle given effects
 *
 * @alpha
 *
 * @typeParam E - Effects to handle
 * @typeParam R - Result type of handling operation
 */
export type Handlers<E extends Effects, R = never>
  = Simplify<
      E extends Code<`${infer S}.${infer C}`, infer P, infer ER> ?
        Eq<P, never> extends false ?
          { [K in S]: { [K in C]: (...parameters: [...P, HandleTactics<ER, R>]) => void | Generator<Effects, void> } }
          : { [K in S]: { [K in C]: ER | Generator<Effects, ER> } }
        : never
    >

/**
 * An error class to represent errors happened while handling codes
 *
 * @internal
 */
class HandleError extends Error {
  /**
   * @param code - A code object that were being handled when error occurred
   * @param reason - The reason
   */
  constructor(code: Code<string, unknown[], unknown>, reason: string) {
    super(`
      Fail to handle action '${code.construction}'\n${reason}
    `.trim());
  }
}

/**
 * Collects effects used in given handlers
 *
 * @internal
 *
 * @typeParam H - Handlers to collect effects from
 */
type UsedEffectsInHandlers<H>
  = keyof H extends infer HK ?
      HK extends keyof H ?
        keyof H[HK] extends infer K ?
          K extends keyof H[HK] ?
            H[HK][K] extends (...parameters: never) => Generator<infer E extends Effects, unknown> ?
              E
              : H[HK][K] extends Generator<infer E extends Effects, unknown> ?
                  E
                  : never
            : Unreachable
          : Unreachable
        : Unreachable
      : Unreachable

/**
 * Exclude effects that are handled by given handlers
 *
 * @internal
 *
 * @typeParam E - Collection of effects
 * @typeParam H - Handlers for 'E'
 */
type ExcludeHandledEffects<E extends Effects, H>
  = Exclude<
      E,
      {
        construction:
          keyof H extends infer HK extends string ?
            HK extends keyof H ?
              keyof H[HK] extends infer K extends string ?
                K extends keyof H[HK] ?
                  `${HK}.${K}`
                  : Unreachable
                : Unreachable
              : Unreachable
            : Unreachable
      }
    >

/**
 * Handles effects of given computation via given handlers
 *
 * @internal
 *
 * @param computation - Computation to resolve some effects
 * @param handlers - Handlers to handle some effects of given computation
 */
function* _handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>(computation: Generator<E, R>, handlers: H)
  : Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R> {
  let raised = computation.next()
  let result: R
  let aborted = false

  while (!raised.done && !aborted) {
    const code: E = raised.value
    const { construction, parameters } = code
    const [scope, constructorName] = construction.split('.')
    let isCodeHandled = false

    if (scope in handlers) {
      if (typeof handlers[scope]![constructorName] === 'function') {
        const possiblyEffectfulComputation = handlers[scope]![constructorName](...parameters, {
          resume(value) {
            raised = computation.next(value)
            isCodeHandled = true
          },
          abort(value) {
            result = value
            aborted = true
            isCodeHandled = true
          }
        })

        if (isGenerator(possiblyEffectfulComputation))
          //@ts-ignore-next-line
          yield* possiblyEffectfulComputation
      } else {
        raised = computation.next(
          isGenerator(handlers[scope]![constructorName]) ?
            //@ts-ignore-next-line
            yield* handlers[scope]![constructorName]
            : handlers[scope]![constructorName]
        )
        isCodeHandled = true
      }
    } else {
      //@ts-ignore-next-line
      raised = computation.next(yield code)
      isCodeHandled = true
    }

    if (!isCodeHandled) throw new HandleError(code, 'Handler functions must call handle tactics')
  }

  if (raised.done) result = raised.value

  return result!
}

/**
 * Handles effects of given computation via given handlers
 *
 * @alpha
 *
 * @param computation - Computation to resolve some effects
 * @param handlers - Handlers to handle some effects of given computation
 * @returns An effectful computation which effects that handled by 'H' are resolved
 */
export function handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>
  (computation: Generator<E, R>, handlers: H)
  : Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R>
/**
 * Handles effects of given computation via given handlers
 *
 * @alpha
 *
 * @param handlers - Handlers to handle some effects of given computation
 * @param computation - Computation to resolve some effects
 * @returns An effectful computation which effects that handled by 'H' are resolved
 */
export function handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>
  (handlers: H, computation: Generator<E, R>)
  : Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R>
/**
 * Handles effects of given block via given handlers
 *
 * @alpha
 *
 * @param handlers - Handlers to handle some effects of given computation
 * @param block - Function with no parameters, resulting effectful computation
 * @returns An effectful computation which effects that handled by 'H' are resolved
 */
export function handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>
  (handlers: H, block: () => Generator<E, R>)
  : Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R>
export function handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>
  (first: Generator<E, R> | H, second: H | Generator<E, R> | (() => Generator<E, R>) )
  : Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R> {
    if (isGenerator(first)) return _handle(first, second as H)
    else if (isGenerator(second)) return _handle(second, first as H)
    else return _handle((second as () => Generator<E, R>)(), first)
}

/**
 * Runs a pure computation
 *
 * @param computation: A pure computation to run
 * @returns The result of evaluating given computation
 */
export function run<R>(computation: Generator<never, R>): R {
  return computation.next().value
}