import { Spec, Action, Effectful, Handlers, EFFECT_NAME, CollectEffectsFromHandlers } from './core'

type Suggestion<M extends string, T = string> = M & T

export type InspectEffectfulFunction<G extends (...args: never) => Generator>
  = G extends (...args: never) => Generator<infer AS, infer R> ?
      [AS] extends [Action<string, string, unknown[]>] ?
        Suggestion<
          'Effects used in the function and return type of the function is inferred as following. Consider typing the function properly with this information.',
          {
            'names of effect used in the function': AS extends Action<infer N, string, unknown[]> ? N : never
            'return type of the function': R
          }
        >
        : Suggestion<
          'Effectful functions must be generator functions which only yield actions but the given function yields non-action value.',
          {
            'types of non-action value': Exclude<AS, Action<string, string, unknown[]>>
          }
        >
      : Suggestion<'Fail to extract type information from the given function.'>

export type InspectEffectHandling<C extends Effectful<Spec, unknown>, H>
  = C extends Effectful<infer SS, infer R> ?
      string extends (SS extends Spec<infer N> ? N : never) ?
        Suggestion<'Malformed effect specification is found. '>
        : H extends Partial<Handlers<SS, R>> ?
            Suggestion<
              'With the given handler, the computation can be handled while resulting following:',
              {
                'effects will be resolved by handling': keyof H
                'effects will remain after handling': Exclude<SS, { [EFFECT_NAME]: keyof H }> |  CollectEffectsFromHandlers<H>
                'result of handling': R
              }
            >
            : Handlers<SS, R> extends infer OH ?
              keyof OH extends infer ENS ?
                ENS extends infer EN extends keyof OH ?
                  EN extends keyof H ?
                    keyof OH[EN] extends infer ANS ?
                      ANS extends infer AN extends keyof OH[EN] ?
                        AN extends keyof H[EN] ?
                          H[EN][AN] extends OH[EN][AN] ?
                            never
                            : Suggestion<
                              'Type of action handler possibly wrong',
                              {
                                'expected type': OH[EN][AN]
                                'given type': H[EN][AN]
                             }
                            >
                          : Suggestion<
                            'Absence of required action handler is found',
                            {
                              'name of missing handler': AN,
                              'type of missing handler': OH[EN][AN]
                            }
                          >
                        : never
                      : never
                    : never
                  : never
                : never
            : never
    : Suggestion<'Fail to extract effect specifications or result type from the given effectful computation.'>