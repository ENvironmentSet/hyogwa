# `hyogwa/env`

Module for environment setting referencing effects (a.k.a. 'Reader').

## `Env<T>`

- `T`: a type of value representing environment setting.

Effect spec template for environment setting referencing effects (a.k.a. 'Reader').

```typescript
import { Effect, createCodeConstructors, Effectful } from 'hyogwa/core'
import { Env } from 'hyogwa/env'
import { unsafeRunSync } from 'hyogwa/runners'

type UA = Effect<'UA', Env<string>>
const UA = createCodeConstructors<UA>('UA')

function* main(): Effectful<UA, string> {
  return yield* UA.env
}

unsafeRunSync(main(), {
  UA: {
    env: navigator.userAgent
  }
})
```