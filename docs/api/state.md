# `hyogwa/state`

Module for state effects.

## `State<T>`

- `T`: a type of state.

Effect spec template for state effects.

Example of implementing counter.
```typescript
import { Effect, createCodeConstructor, Effectful } from 'hyogwa/core'
import { State } from 'hyogwa/state'

type Counter = Effect<'Counter', State<number>>
const Counter = createCodeConstructor<Counter>('Counter')

function* increase(count: number): Effectful<Counter, void> {
  const prevCount = yield* Counter.get()

  yield* Counter.set(prevCount + count)
}
```

Example of deriving IO effect from State.
```typescript
import { Effect, createCodeConstructor, Effectful } from 'hyogwa/core'
import { State } from 'hyogwa/state'

type IO = Effect<'IO', State<string>>
const IO = createCodeConstructor<IO>('IO')

function* main(): Effectful<IO, void> {
  const userName = yield* IO.get()

  yield* IO.set(`Hi ${userName}!`)
}
```