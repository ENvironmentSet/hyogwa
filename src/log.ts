/**
 * Effect spec template for logging effects (a.k.a. 'Writer')
 *
 * @alpha
 *
 * @typeParam T - A type of value representing log
 */
export interface Log<T> {
  log(representation: T): void
}