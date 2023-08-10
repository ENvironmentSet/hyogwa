import { Action } from './core'

type Suggestion<M extends string, T> = M & T

export type InspectEffectfulFunction<G extends GeneratorFunction> =
 G extends (...args: never) => Generator<infer AS, infer R> ?
    AS extends Action<string, string, unknown[]> ?
      Suggestion<
        'We have inferred effects used in the function and return type of the function. Consider typing the function properly with this information.',
        {
          'name of effects used in the function': AS extends infer A extends Action<string, string, unknown[]> ?
            A['effectName']
            : never
          'return type of the function': R
        }
      >
      : Suggestion<
        'Effectful functions must be generator functions which only yields actions(effectful terms) but found value of this type can be yield in the given function',
        {
          'non action type': Exclude<AS, Action<string, string, unknown[]>>
        }
      >
    : 'Fail to extract type level information of given function'
