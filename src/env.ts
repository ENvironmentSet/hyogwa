import { Spec } from './core';

export interface Env<T, N extends string> extends Spec<N> {
  env: T
}