/**
 * Effect spec template for state effects
 *
 * @alpha
 *
 * @typeParam T - A type of state
 */
export interface State<T> {
  get(): T
  set(nextState: T): void
}