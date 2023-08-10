import { Spec } from './core';

export interface Log<T, N extends string> extends Spec<N> {
  log(representation: T): void
}