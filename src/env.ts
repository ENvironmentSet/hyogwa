/**
 * Effect spec template for environment setting referencing effects (a.k.a. 'Reader')
 *
 * @beta
 *
 * @typeParam T - A type of value representing environment setting
 *
 * @example Reading userAgent
 *
 * ```typescript
 * import { Effect, createPrimitives, Effectful } from 'hyogwa/core'
 * import { Env } from 'hyogwa/env'
 * import { unsafeRunSync } from 'hyogwa/runners'
 *
 * type UA = Effect<'UA', Env<string>>
 * const UA = createPrimitives<UA>('UA')
 *
 * function* main(): Effectful<UA, string> {
 *   return yield* UA.env
 * }
 *
 * unsafeRunSync(main(), {
 *   UA: {
 *     env: navigator.userAgent
 *   }
 * })
 * ```
 */
export interface Env<T> {
  env: T
}