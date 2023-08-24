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
export interface Code<C, P, T> { // Here, unknown[] means arbitrary-length tuple type
  construction: C
  parameters: P
  type: T // This field doesn't exist at runtime. Only for holding phantom type parameter 'T'
}

/**
 * Effect type constructor
 *
 * With the name and spec of the new effect, constructs type representing the effect.
 * Note that functions listed in the effect specification must not be generic(i.e. they must be monomorphic).
 *
 * @beta
 *
 * @typeParam N - The name of the new effect (a string literal type is expected)
 * @typeParam S - The specification of the new effect
 *
 * @example Creating type representing IO effect
 *
 * ```typescript
 * import { Effect } from 'hyogwa/core'
 *
 * type IO = Effect<'IO', {
 *   read(): string
 *   write(text: string): void
 * }>
 * ```
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
 * @beta
 *
 * @example Array#map for effectful functions
 *
 * ```typescript
 * import { Effects, Effectful } from 'hyogwa/core'
 *
 * function* map<T, U, E extends Effects>(array: T[], f: (x: T) => Effectful<E, U>): Effectful<E, U[]> {
 *   const result: U[] = []
 *
 *   for (const element of array) {
 *     result.push(yield* f(element))
 *   }
 *
 *   return result
 * }
 * ```
 */
export type Effects = Code<string, unknown[], unknown>

/**
 * Constructor of type representing effectful computation
 *
 * With given effects 'E' and type of evaluation result value 'R',
 * constructs type of effectful computations that may produce arbitrary number of effects specified in type 'E'
 * and result in value of type 'R'
 *
 * NOTE: It's highly recommended to explicitly type every effectful function with this type.
 *
 * @beta
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
 *
 * @example
 *
 * ```
 * function* myFunction(): Effectful<MyEffect, someReturnType> {
 *   // code goes here
 * }
 * ```
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
      E_ extends Code<`${infer _}.${infer C}`, infer P extends unknown[], infer R> ?
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
  = Simplify<
      NameOfEffect<E> extends infer N ?
        Eq<UnionToIntersection<N>, never> extends false ?
          _CodeConstructors<E, E>
          : never
        : never
    >

/**
 * Extract name of effect from type level representation of effect
 *
 * @internal
 *
 * @typeParam E - An effect to extract name
 */
export type NameOfEffect<E extends Effects> = E['construction'] extends `${infer N}.${infer _}` ? N : never

/**
 * Creates code constructors for given effect
 *
 * @beta
 *
 * @param effectName - the name of given effect
 * @returns code constructors for given effect
 *
 * @example Defining IO Effect
 *
 * ```typescript
 * import { Effect, createCodeConstructors } from 'hyogwa/core'
 *
 * type IO = Effect<'IO', {
 *   read(): string
 *   write(text: string): void
 * }>
 * const IO = createCodeConstructors<IO>('IO')
 * ```
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
export interface HandleTactics<in ER, in R> {
  resume(value: ER): void
  abort(value: R): void
}

/**
 * Constructs type of value to handle given effects
 *
 * Only for constraining type parameters or giving typescript hint (via 'satisfies' keyword) about handlers currently being defined.
 * Do not use this type to directly type something.
 *
 * @internal
 *
 * @typeParam E - Effects to handle
 * @typeParam R - Result type of handling operation
 *
 * @example
 *
 * ```typescript
 * const someHandlerForSomeEffect = {
 *   // handler definition goes here
 * } satisfies Handlers<SomeEffect>
 * ```
 */
type _Handlers<E extends Effects, R>
  = UnionToIntersection<
      E extends Code<`${infer S}.${infer C}`, infer P extends unknown[], infer ER> ?
        Eq<P, never> extends false ?
          { [K in S]: { [K in C]: (...parameters: [...P, HandleTactics<ER, R>]) => void | Effectful<Effects, void> } }
          : { [K in S]: { [K in C]: ER | Effectful<Effects, ER> } }
        : never
    >

/**
 * Constructs type of value to handle given effects
 *
 * Only for constraining type parameters or giving typescript hint (via 'satisfies' keyword) about handlers currently being defined.
 * Do not use this type to directly type something.
 *
 * @internal
 *
 * @privateRemarks
 *
 * Wrapped version of '_Handlers'. Use this instead of '_Handlers'.
 *
 * @typeParam E - Effects to handle
 * @typeParam R - Result type of handling operation
 */
export type Handlers<E extends Effects, R = never>
  = Simplify<_Handlers<E, R>>

/**
 * An error class to represent errors happened while handling codes
 *
 * @internal
 */
export class HandleError extends Error {
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
export type UsedEffectsInHandlers<H>
  = keyof H extends infer HK ?
      HK extends keyof H ?
        keyof H[HK] extends infer K ?
          K extends keyof H[HK] ?
            H[HK][K] extends (...parameters: never) => Effectful<infer E extends Effects, unknown> ?
              E
              : H[HK][K] extends Effectful<infer E extends Effects, unknown> ?
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
export type ExcludeHandledEffects<E extends Effects, H>
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
function* _handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>(computation: Effectful<E, R>, handlers: H)
  : Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R> {
  let raised = computation.next()
  let result: R
  let aborted = false

  while (!raised.done && !aborted) {
    const code: E = raised.value
    const { construction, parameters } = code
    const [ scope, constructorName ] = construction.split('.')
    let isCodeHandled = false

    if (scope in handlers) {
      //@ts-ignore-next-line
      if (typeof handlers[scope][constructorName] === 'function') {
        //@ts-ignore-next-line
        const possiblyEffectfulComputation = handlers[scope][constructorName](...parameters, {
          //@ts-ignore-next-line
          resume(value) {
            if (isCodeHandled) throw new HandleError(code, 'cannot call handle tactics more than once')

            raised = computation.next(value)
            isCodeHandled = true
          },
          //@ts-ignore-next-line
          abort(value) {
            if (isCodeHandled) throw new HandleError(code, 'cannot call handle tactics more than once')

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
          //@ts-ignore-next-line
          isGenerator(handlers[scope][constructorName]) ?
            //@ts-ignore-next-line
            yield* handlers[scope][constructorName]
            //@ts-ignore-next-line
            : handlers[scope][constructorName]
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
 * Handle functions must call handle tactics exactly once before they terminate.
 * In addition, they must not have any implicit effects(effects weren't typed in their signature).
 *
 * @beta
 *
 * @param computation - Computation to resolve some effects
 * @param handlers - Handlers to handle some effects of given computation
 * @returns An effectful computation which effects that handled by 'H' are resolved
 *
 * @example Handling Exception
 *
 * ```typescript
 * import { Effect, createCodeConstructors, Effectful, handle, run } from 'hyogwa/core'
 * import { Exception } from 'hyogwa/exception'
 *
 * type DivideByZero = Effect<'DivideByZero', Exception<void>>
 * const DivideByZero = createCodeConstructors<DivideByZero>('DivideByZero')
 *
 * function* div(x, y): Effectful<DivideByZero, number> {
 *   if (y === 0) yield* DivideByZero.raise()
 *
 *   return x / y
 * }
 *
 * function main(): Effectful<never, number> {
 *   const result = yield* handle(
 *     div(1, 0),
 *     {
 *       DivideByZero: {
 *         raise(_, { abort }) {
 *           abort(NaN)
 *         }
 *       }
 *     }
 *   )
 *
 *   return result
 * }
 *
 * run(main())
 * ```
 */
export function handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>
  (computation: Effectful<E, R>, handlers: H)
  : Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R>
/**
 * Overload for 'handle', nothing different except order of arguments are reversed.
 *
 * @beta
 */
export function handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>
  (handlers: H, computation: Effectful<E, R>)
  : Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R>
/**
 * Handles effects of given block via given handlers
 *
 * Handle functions must call handle tactics exactly once before they terminate.
 * In addition, they must not have any implicit effects(effects weren't typed in their signature).
 *
 * @beta
 *
 * @param handlers - Handlers to handle some effects of given computation
 * @param block - Function with no parameters, resulting effectful computation
 * @returns An effectful computation which effects that handled by 'H' are resolved
 *
 * @example Handling Exception
 *
 * ```typescript
 * import { Effect, createCodeConstructors, Effectful, handle, run } from 'hyogwa/core'
 * import { Exception } from 'hyogwa/exception'
 *
 * type DivideByZero = Effect<'DivideByZero', Exception<void>>
 * const DivideByZero = createCodeConstructors<DivideByZero>('DivideByZero')
 *
 * function* div(x, y): Effectful<DivideByZero, number> {
 *   if (y === 0) yield* DivideByZero.raise()
 *
 *   return x / y
 * }
 *
 * function main(): Effectful<never, number> {
 *   const result = yield* handle(
 *     div(1, 0),
 *     {
 *       DivideByZero: {
 *         raise(_, { abort }) {
 *           abort(NaN)
 *         }
 *       }
 *     }
 *   )
 *
 *   return result
 * }
 *
 * run(main())
 * ```
 */
export function handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>
  (handlers: H, block: () => Effectful<E, R>)
  : Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R>
export function handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>
  (first: Effectful<E, R> | H, second: H | Effectful<E, R> | (() => Effectful<E, R>) )
  : Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R> {
    if (isGenerator(first)) return _handle(first, second as H)
    else if (isGenerator(second)) return _handle(second, first as H)
    else return _handle((second as () => Effectful<E, R>)(), first)
}

/**
 * Runs a pure computation
 *
 * @param computation - A pure computation to run
 * @returns The result of evaluating given computation
 *
 * @example
 *
 * ```typescript
 * run(pureComputationToRun)
 * ```
 */
export function run<R>(computation: Effectful<never, R>): R {
  return computation.next().value
}