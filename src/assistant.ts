import { Unreachable } from './utils';
import { Effects, NameOfEffect } from './core';

interface Suggestion<M extends string, T = never> {
  message: M
  additionalInformation: T
}

export type InspectEffectfulFunction<G extends (...parameters: never) => Generator>
  = G extends (...parameters: never) => Generator<infer E, infer R> ?
      [E] extends [Effects] ?
        Suggestion<
          'Effects used in the function and return type of the function is inferred as following.',
          {
            'names of effect used in the function': E extends infer E_ extends Effects ? NameOfEffect<E_> : never
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