# `hyogwa/log`

Module for logging effects (a.k.a. 'Writer').

## `Log<T>`

- `T`: a type of value representing log.

Effect spec template for logging effects (a.k.a. 'Writer').

```typescript
import { Effect, createPrimitives, Effectful } from 'hyogwa/core'
import { Log } from 'hyogwa/log'
import { unsafeRunSync } from 'hyogwa/runners'

type Console = Effect<'Console', Log<string>>
const Console = createPrimitives<Console>('Console')

function* main(): Effectful<Console, void> {
  yield* Console.log('HI!')
  yield* Console.log('BYE!')
}

unsafeRunSync(main(), {
  Console: {
    log(text, { resume }) {
      console.log(text)
      resume()
    }
  }
})
```