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
 * @alpha
 *
 * @typeParam G - Type of effectful function to inspect
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
 * Inspects handling given effectful computation with given handler at type level
 *
 * @alpha
 *
 * @typeParam C - Type of effectful computation to inspect
 * @typeParam H - Type of handlers
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