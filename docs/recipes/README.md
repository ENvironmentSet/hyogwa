# Recipes for users of `hyogwa`

## Defining new effects

```typescript
import { Effect, createPrimitives } from 'hyogwa/core'

type IO = Effect<'IO', {
  read(): string
  write(text: string)
}>
const IO = createPrimitives<IO>('IO')
```

You'll have:

- A type `IO` representing computation effect `'IO'`, which rises from evaluation of primitive operations `read` and `write`.
- A variable `IO` holding primitive operations involving `IO` Effect while evaluation.

Object types passed to `Effect` are effect specifications. They specify primitive operations -- the functions which have
effects by themselves -- of the new effect.  

### Shorthand for constant functions

If your effect have constant functions as primitive operations like blow:

```typescript
import { Effect, createPrimitives } from 'hyogwa/core'

type Config = Effect<'Config', {
  getMode(): 'dev' | 'prod'
}>
const Config = createPrimitives<Config>('Config')
```

You may shorten the code like this:

```typescript
import { Effect, createPrimitives } from 'hyogwa/core'

type Config = Effect<'Config', {
  mode: 'dev' | 'prod'
}>
const Config = createPrimitives<Config>('Config')
```

However, the `read` operation in previous example can't be shortened like this for now. Since it's not constant function.

### Using effect specification templates

Effect specification templates are generic types(type constructors) that produces effect specifications.
Hyogwa has modules of effects specification for general effects.

```typescript
import { Effect, createPrimitives } from 'hyogwa/core'
import { Exception } from 'hyogwa/exeption'

type MyExeption = Effect<'MyException', Exception<string>>
const MyExeption = createPrimitives<MyExeption>('MyExeption')
```

### Combining multiple effects

You can combine multiple effects by creating union of them.

```typescript
type CombinedEffect = IO | Config | MyException
```

### Working with polymorphic functions

If your effect's primitive operation has to be polymorphic over something. You can do it like blow:

```typescript
import { createPrimitives, Effect, Effectful, HandleTactics } from 'hyogwa/core';
import { unsafeRunAsync } from 'hyogwa/runners';

export type AsyncTask<R = unknown> = Effect<'AsyncTask', {
  wait(promise: Promise<R>): R
}>
const _AsyncTask = <R>() => createPrimitives<AsyncTask<R>>('AsyncTask')
const AsyncTask = {
  * wait<R>(promise: Promise<R>): Effectful<AsyncTask<R>, R> {
    return yield* _AsyncTask<R>().wait(promise)
  }
}

function promisify<R>(computation: Effectful<AsyncTask, R>): Promise<R> {
  return unsafeRunAsync(computation, {
    AsyncTask: {
      async wait<PR>(promise: Promise<PR>, { resume }: HandleTactics<PR, R>) {
        resume(await promise)
      }
    }
  })
}
```

This is the only way for now. We're looking for better api.

## Writing effectful functions

Effectful computations are just a generator which may yields effects. All you need to define effectful function is to use
generator function declaration(or expression).

```typescript
function* main() {
  const name = yield* IO.read()
  
  yield* IO.write(`Hi ${name}`)
}
```

Function above is effectful function involving `IO` effect we previously defined. If you want to run effectful computation
and get result of it, you need to yield it with `yield*`. Using `yield` inside effectful function is forbidden.

Also, it's good to type every effectful functions with `Effectful` type like this:

```typescript
import { Effectful } from 'hyogwa/core'

function* main(): Effectful<IO, void> {
  const name = yield* IO.read()
  
  yield* IO.write(`Hi ${name}`)
}
```

Typescript compiler will infer all the types you need in most cases, but this will help you and your colleagues to read 
code easily.

### Having multiple effects

No effort is required to have functions with many effects.

```typescript
function* main() {
  const name = yield* IO.read()
  
  if (name.length === 0) yield* MyException.raise(`Names can't be empty`)
  
  yield* IO.write(`Hi ${name}`)
}

// Explicitly typed style:

function* main(): Effectful<IO | MyException, void> {
  const name = yield* IO.read()

  if (name.length === 0) yield* MyException.raise(`Names can't be empty`)

  yield* IO.write(`Hi ${name}`)
}
```

### Being polymorphic over effects

You can write function polymorphic over effects like this:

```typescript
import { Effects, Effectful } from 'hyogwa/core'

function* map<T, U, E extends Effects>(array: T[], f: (x: T) => Effectful<E, U>): Effectful<E, U[]> {
  const result: U[] = []

  for (const element of array) {
    result.push(yield* f(element))
  }

  return result
}
```

## Handling effects

You can handle effects of the computation thus remove(resolve) them from the type.

```typescript
import { Effect, createPrimitives, Effectful, handle } from 'hyogwa/core'

type Exception = Effect<'Exception', {
  raise(reason: string): never
}>

function* div(x: number, y: number): Effectful<Exception, number> {
  if (y === 0) return yield* Exception.raise('Cannot divide number by zero.') // or you may use the 'absurd' function here.
  else return x / y
}

function* div2(x: number, y: number): Effectful<never, number> {
  return yield* handle(
    div(x, y),
    {
      Exception: {
        raise(reason, { abort }) {
          console.error(reason) // just for debugging
          abort(NaN)
        }
      }
    }
  )
}
```

`never` means the computation has no effects. `handle` is the function which takes an effectful computation and handlers 
for it. Returns effect handled computation. Handlers are collection of handle functions which handle calls to primitive 
operations of effects(thus define meanings of each primitive operations). All the parameters are forwarded to handle 
functions. In addition, handle functions one more object of functions as last argument. It's called handle tactics.
Handle tactics are functions to determine how the control flow will be after the call of the primitive operation. There 
are two handle tactics available now. `resume(value)` resumes the execution of the effectful computation with the given 
value `value`. `abort(value)` aborts currently handled effectful computation and set `value` as result of total `handle`
operation. Note that you must call one of these handle tactics exactly once before they terminate(finish to execute).

### Handling effects in effectful functions

You can handle effects in effectful function without calling it.

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

### Handle constant functions written in shorthand style

```typescript
import { Effect, createPrimitives } from 'hyogwa/core'
import { withHandler } from 'hyogwa/with-handler'

type Config = Effect<'Config', {
  mode: 'dev' | 'prod'
}>
const Config = createPrimitives<Config>('Config')

function* someFunction() {
  const mode = yield* Config.mode
  
  if (mode === 'dev') yield* IO.write('we are on dev mode now')
  else if (mode === 'dev') yield* IO.write('we are on prod mode now')
}

const main = withHandler(someFunction, {
  Config: {
    mode: 'dev'
  }
})
```

### Handle functions with effects

Handle functions can have effects.

```typescript
import { Effect, createPrimitives, handle } from 'hyogwa/core'

type Config = Effect<'Config', {
  getMode(): 'dev' | 'prod'
}>
const Config = createPrimitives<Config>('Config')

function* someFunction() {
  const mode = yield* Config.getMode()
  
  if (mode === 'dev') yield* IO.write('we are on dev mode now')
  else if (mode === 'dev') yield* IO.write('we are on prod mode now')
}

function* main() {
  return yield* handle(
    someFunction(),
    {
      Config: {
        * getMode({ resume }) {
          yield* IO.write('config was read')
          
          resume('dev')
        }
      }
    }
  )
}
```

### Defining handlers alone

You can define handlers for some effects as variable. In that case `Handlers` type constructor might be helpful.

```typescript
import { Handlers } from 'hyogwa/core'

const ConfigHandlers = {
  Config: {
    * getMode({ resume }) {
      yield* IO.write('config was read')

      resume('dev')
    }
  }
} satisfies Handlers<Config>
```

### Block patterns

When you have to handle chuck of effectful computations, use the 'block patterns':

```typescript
handle(SomeHandler, function* () {
  const x = yield* IO.readNum()
  const y = yield* IO.readNum()
  
  yield* Debug.log(x + y)
  
  return x + y
}) // we call this generator function expression 'block' and this will be executed immediately
```

## Running effectful computations

You can run effectful computations with functions called `runners`. Check [our api document](../api/runners) for more.

## Using code assistants

You can use built-in code assistants to inspect your code. Check [our api document](../api/assistants.md) for more.

## Working with other functional programming libraries

Hyogwa has module `hyogwa/monad` to provide functions needed for `Effectful` to be monad. If you prefer pipeline
style interface or want to define monad instance of `Effectful`, use the module. Check more on 
[our api document for `hyogwa/monad`](../api/monad.md).