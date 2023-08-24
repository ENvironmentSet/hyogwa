# `hyogwa/core`

Essential things you need to use hyogwa stays here. You may import this module via 
`import { ... } from 'hyogwa` instead of `import { ... } from 'hyogwa/core'`.

## `Effect<N, S>`

- `N` : name of the new effect, a string literal type expected.
- `S` : effect specification for the new effect.

Interpreting given effect specification `S`, constructs type representing the new effect of name `N`

```typescript
import { Effect } from 'hyogwa/core'

type IO = Effect<'IO', {
  read(): string
  write(text: string): void
}>
```

Although hyogwa is designed for users not to mind how it internally represents/treats effects, It's not bad to 
understand what's inside of effect types. Internally, effect types are union of `Code` types. Each `Code` type represents
possible constructions of arbitrary kind of computation. Therefore, effect types are considered as set of possible
primitive constructions of effectful computations. And it's also useful to note that those 'constructions' are derived 
from effect specification.

For instance, construction of `IO` effect type above results in following type.

```typescript
type IO = Code<'IO.read', [], string> | Code<'IO.write', [string], void>
```

Meaning that effect `IO` may raise from computations constructed by two primitive constructions. One is of name `IO.read` taking nothing and resulting value of 
type `string`, another is of name `IO.write` taking `string` value resulting value of type `void`.

## `Effects`

Supertype of every effect. You may use this type to constraint type parameter to be any specific effect type.
Also, it's possible to interpret this type as kind(type of type) of every effect representing types.

## `createCodeConstructors<E>(name: NameOfEffect<E>): CodeConstructors<E>`

- `E` : an effect to create code constructors.
- `name` : name of the effect, a string literal expected.

Create 'code constructors' for given effect `E` of name `name`. Code constructors are functions which create 
representation of effectful computation. You may think of code constructors as primitive operations of an effect.

```typescript
import { Effect, createCodeConstructors } from 'hyogwa/core'

type IO = Effect<'IO', {
  read(): string
  write(text: string): void
}>
const IO = createCodeConstructors<IO>('IO')
```

Variable `IO` is object of type `{ read(): Effectful<IO, string>, write(text: string): Effectful<IO, void> }`. Here,
you may think of `read` and `write` as primitive operations to introduce `IO` effect.

## `Effectful<E, R>`

- `E` : effects that involved.
- `R` : type of evaluation result.

Represents computation of result type `R` involving effects `E`.

Note that it's strongly recommended to use `Effectful` type to type every effectful functions you define with generator 
function declaration. Although types will be inferred correctly and smoothly, this habit will help you to read code easily.

## `HandleTactics<ER, R = never>`

- `ER` : evaluation result type of currently handled code (i.e. type of values which will be passed to `resume`)
- `R` : result type of whole handling operation (i.e. type of values which will be passed to `abort`)

Interface for handle tactics.

## `Handlers<E, R>`

- `E` : effects to handle.
- `R` : type of handling computation's result

Constructs type of handlers to create given effects `E` while resulting value of type `R` as handling computation's 
evaluation result.

## `handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>(computation: Effectful<E, R>, handlers: H): Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R>`

- `E` : effects of the target computation.
- `R` : result type of the target computation.
- `H` : type of handlers.
- `computation` : the computation to handle some effects.
- `handlers` : handlers to handle some effect of the target computation.

Handles some effects of the given computation `computation` via the given handlers `handlers`. As you can see in the 
type signature, handled effects are eliminated at type signature after handling and effects newly involved are added 
after handling.

Functions in `handlers` must be pure(i.e. never have implicit effects) and must call handle tactic before terminate. Handle tactics are boxed in associative array and passed
as last parameter of functions. Following handle tactics are available.

- `resume(value: result type of currently handled code): void` : Resume the evaluation of given computation with `value`.
- `abort(value: R): void` : Aborting the evaluation of given computation, make `value` result of the handling computation.

```typescript
import { Effect, createCodeConstructors, Effectful, handle } from 'hyogwa/core'

type Name = Effect<'Env', {
  get(): string
}>
const Name = createCodeConstructors<Name>('Name')

function* main(): Effectful<Name, string> {
  const name = yield* Name.getEnv()
  
  return `Hi ${name}. Welcome to hyogwa!`
}

handle(main(), {
  Name: {
    get({ resume }) {
      resume('ENvironmentSet')
    }
  }
})
```

This function has two more overloads. One takes the same values as arguments but in reversed order, and the other takes 
`block` instead of `computation`. `Block` is inline generator function that will be executed immediately by the `handle`.

- `handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>(handlers: H, computation: Generator<E, R>): Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R>`
- `handle<E extends Effects, R, H extends Partial<Handlers<E, R>>>(handlers: H, block: () => Generator<E, R>): Effectful<ExcludeHandledEffects<E, H> | UsedEffectsInHandlers<H>, R>`

Basically, the role and behaviour of each overload is same as well as others. However, you can pick one of them to 
express same behavior more readably each time you handle effects. Here's the rule of thumbs:

1. Longer argument goes the last.
2. If length of both expression that constructs computation and handlers are similar, computations goes the first.
3. If you need to combine multiple effectful computations in complex way write combination of them as form of inline 
generator function using third overload of the `handle`.

Here's the example of using the third overload of `handle`:

```typescript
handle(SomeHandler, function* () {
  const x = yield* IO.readNum()
  const y = yield* IO.readNum()
  
  yield* Debug.log(x + y)
  
  return x + y
})
```

## `run<R>(computation: Effectful<never, R>): R`

- `R` : type of given computation's result.
- `computation` : a pure computation to evaluate.

Evaluates the given pure computation.