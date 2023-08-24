# `hyogwa/async-task`

Module for asynchronous effects.

```typescript
import { Effect, Effectful, createCodeConstructor, handle } from 'hyogwa/core';
import { AsyncTask, promisify } from 'hyogwa/async-task';

type Server = Effect<'Server', {
  getUserAge(name: string): number
  // more api endpoints goes blow
}>
const Server = createCodeConstructor<Server>('Server')

function* main() {
  const myAge = yield* Server.getUserAge('jaewon')
  
  return myAge
}

promisify(
  handle(
    main(),
    {
      Server: {
        * getUserAge(name, { resume }) {
          const res = yield* AsyncTask.wait(fetch(/* some url */))
          const { age } = yield* AsyncTask.wait(res.json())
          
          resume(age)
        }
      }
    }
  )
).then(console.log, console.error)

```

## `AsyncTask<R = unknown>`

An effect for computations rely on asynchronous tasks.

## `promisify<R>(computation: Effectful<AsyncTask, R>): Promise<R>`

- `R` : type of given computation's result.
- `computation` : a computation to transform.

Converts given effectful computation to promise.