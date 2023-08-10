import { Spec } from './core';

export interface State<T, N extends string> extends Spec<N> {
  state: T
  get(): T
  set(nextState: T): void
}