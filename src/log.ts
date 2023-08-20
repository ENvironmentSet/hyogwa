/**
 * Effect spec template for logging effects (a.k.a. 'Writer')
 *
 * @alpha
 *
 * @typeParam T - A type of value representing log
 *
 * @example Simple application logging in console
 *
 * ```typescript
 * import { Effect, createCodeConstructors, Effectful } from 'hyogwa/core'
 * import { Log } from 'hyogwa/log'
 * import { unsafeRunSync } from 'hyogwa/runners'
 *
 * type Console = Effect<'Console', Log<string>>
 * const Console = createCodeConstructors<Console>('Console')
 *
 * function* main(): Effectful<Console, void> {
 *   yield* Console.log('HI!')
 *   yield* Console.log('BYE!')
 * }
 *
 * unsafeRunSync(main(), {
 *   Console: {
 *     log(text, { resume }) {
 *       console.log(text)
 *       resume()
 *     }
 *   }
 * })
 * ```
 */
export interface Log<T> {
  log(representation: T): void
}