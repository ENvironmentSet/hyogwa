# `hyogwa/exception`

Module for exception effects (similar to 'Either' or 'Result' monads).

## `Exception<T>`

- `T`: a type of value representing error.

Effect spec template for exception effects (similar to 'Either' or 'Result' monads).

```typescript
import { Effect, createPrimitives, Effectful, handle, run } from 'hyogwa/core'
import { Exception } from 'hyogwa/exception'

type DivideByZero = Effect<'DivideByZero', Exception<void>>
const DivideByZero = createPrimitives<DivideByZero>('DivideByZero')

function* div(x, y): Effectful<DivideByZero, number> {
  if (y === 0) yield* DivideByZero.raise()

  return x / y
}

function* main(): Effectful<never, number> {
  const result = yield* handle(
    div(1, 0),
    {
      DivideByZero: {
        raise(_, { abort }) {
          abort(NaN)
        }
      }
    }
  )

  return result
}

run(main())
```

## `SimpleException`

Simple implementation of exception effect where string represents error and error representation can be omitted.

## `unsafeSimpleExceptionHandlers`

Unsafe handlers for `SimpleException`. Implements exception effects with `throw` statement.
