import { Effectful, Effects, ExcludeHandledEffects, handle, Handlers, UsedEffectsInHandlers } from './core.js'

/**
 * Wraps function with given handlers
 *
 * Handles effects of given effectful function
 *
 * @beta
 *
 * @param f - An effectful function to be handled
 * @param handlers - A handlers to handle effects of `f`
 */
export function withHandler
  <P extends unknown[], E extends Effects, R, const H extends Partial<Handlers<E, R>>> // Type parameters
  (f: (...parameters: P) => Effectful<E, R>, handlers: H) // Parameters
  : (...parameters: P) => Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R> { // Return type
  return (...parameters) => handle(
    f(...parameters),
    handlers
  )
}