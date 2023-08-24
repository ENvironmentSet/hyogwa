import { Eq, Unreachable } from './utils';
import { Effects, Handlers, NameOfEffect, ExcludeHandledEffects, UsedEffectsInHandlers } from './core';

/**
 * Type constructor constructing message representing type
 *
 * @internal
 *
 * @typeParam M - A message
 * @typeParam T - Additional information
 */
interface Suggestion<M extends string, T = never> {
  message: M
  additionalInformation: T
}

/**
 * Inspects given effectful function
 *
 * What this utility can do:
 * - Inferences effects used in the function
 * - Inferences result type of the function
 * - Check whether the function is valid effectful function
 *
 * @beta
 *
 * @typeParam G - Type of effectful function to inspect
 *
 * @example
 *
 * Save inspection result in the form of type alias, view it via IDE extension
 * or using typescript compiler by making error about it deliberately.
 * ```typescript
 * type Inspection = InspectEffectfulFunction<typeof functionToInspect>
 * ```
 */
export type InspectEffectfulFunction<G extends (...parameters: never) => Generator>
  = G extends (...parameters: never) => Generator<infer E, infer R> ?
      [E] extends [Effects] ?
        Suggestion<
          'Effects used in the function and return type of the function is inferred as following.',
          {
            'names of effect used in the function': E extends Effects ? NameOfEffect<E> : never
            'return type of the function': R
          }
        >
        : Suggestion<
          'Effectful functions must be generator functions which only yield codes but the given function yields non-code value.',
          {
            'types of non-code value': Exclude<E, Effects>
          }
        >
      : Unreachable

/**
 * Inspects handling given effectful computation with given handlers at type level
 *
 * What this utility can do:
 * - Predict result of handling the computation with the handlers
 * - Find error in type of handlers
 * - Find missing part of handlers
 *
 * NOTE: If this utility produces 'never' type, then type of your handler is possibly broken seriously.
 *
 * @beta
 *
 * @typeParam C - Type of effectful computation to inspect
 * @typeParam H - Type of handlers
 *
 * @example
 *
 * Save inspection result in the form of type alias, view it via IDE extension
 * or using typescript compiler by making error about it deliberately.
 * ```typescript
 * type Inspection = InspectEffectHandling<typeof computationToHandle, typeof handlerToUse>
 * ```
 */
export type InspectEffectHandling<C extends Generator<Effects, unknown>, H>
  = C extends Generator<infer E extends Effects, infer R> ?
      Eq<E extends Effects ? NameOfEffect<E> : never, string> extends false ?
        H extends Partial<Handlers<E, R>> ?
          Suggestion<
            'With the given handler, the computation can be handled while resulting following:',
            {
              'effects will be resolved by handling': Exclude<E, ExcludeHandledEffects<E, H>>
              'effects will remain after handling': ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>
              'result of handling': R
            }
          >
          : Handlers<E, R> extends infer OH ?
              keyof OH extends infer KOH extends keyof OH ?
                KOH extends keyof H ?
                  keyof OH[KOH] extends infer HK extends keyof OH[KOH] ?
                    HK extends keyof H[KOH] ?
                      H[KOH][HK] extends OH[KOH][HK] ?
                        never
                        : Suggestion<
                          'Type of handler possibly wrong',
                          {
                            'expected type': OH[KOH][HK]
                            'given type': H[KOH][HK]
                          }
                        >
                      : Suggestion<
                        'Absence of required action handler is found',
                        {
                          'name of missing handler': HK,
                          'type of missing handler': OH[KOH][HK]
                        }
                      >
                    : Unreachable
                  : never
                : Unreachable
              : Unreachable
        : Suggestion<'\'Effects\' should not be used directly'>
      : Unreachable