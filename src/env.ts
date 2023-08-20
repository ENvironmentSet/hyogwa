/**
 * Effect spec template for environment setting referencing effects (a.k.a. 'Reader')
 *
 * @alpha
 *
 * @typeParam T - A type of value representing environment setting
 *
 * @example Reading userAgent
 *
 * ```typescript
 * import { Effect, createCodeConstructors, Effectful } from 'hyogwa/core'
 * import { Env } from 'hyogwa/env'
 *
 * type UA = Effect<'UA', Env<string>>
 * const UA = createCodeConstructors<UA>('UA')
 *
 * function* main(): Effectful<UA, string> {
 *   return yield* UA.env
 * }
 * ```
 */
export interface Env<T> {
  env: T
}