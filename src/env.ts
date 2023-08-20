/**
 * Effect spec template for environment setting referencing effects (a.k.a. 'Reader')
 *
 * @alpha
 *
 * @typeParam T - A type of value representing environment setting
 */
export interface Env<T> {
  env: T
}