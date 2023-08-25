# `hyogwa/with-handler`

Module of function handling effects of given effectful function.

## `withHandler<P extends unknown[], E extends Effects, R, H extends Partial<Handlers<E, R>>>(f: (...parameters: P) => Effectful<E, R>, handlers: H): (...parameters: P) => Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R>`

Wraps function with given handlers.

```typescript
import { withHandler } from 'hyogwa/with-handler'

const div2 = withHandler(div, {
  Exception: {
    raise(reason, { abort }) {
      console.error(reason) // just for debugging
      abort(NaN)
    }
  }
})
```