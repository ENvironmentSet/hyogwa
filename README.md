# hyogwa — Natural 🌿 effect system that fits TypeScript

```typescript
import { Spec, createEffect, Effectful } from 'hyogwa/core';
import { unsafeRunSync } from 'hyogwa/runners';

// Defining own IO effect

interface IO extends Spec<'IO'> {
  read(): string
  write(text: string): void
}
const IO = createEffect<IO>('IO')

// Having a function with IO effect

function* main(): Effectful<IO, void> {
  const name = yield* IO.read()

  yield* IO.write(`Welcome to hyogwa, ${name}!`)
}

// Running the main function while handling effects

unsafeRunSync(main(), {
  IO: {
    read({ resume }) {
      resume(prompt() || '')
    },
    write(text, { resume }) {
      alert(text)
      resume()
    }
  }
})
```

No more suspicious wrapper functions, No more mess with pipelines, No more scary types. 
Just plain typescript functions, and plain typescript functions only.

> **⚠️ CAUTION**: This project is work-in-progress. Use at your own risk!

## Why hyogwa?

For some codes, we may consider only its result.
When we read an arithmetic expression or a boolean expression we just evaluate it, remember the result and move to next code.
For the other codes, however, we should consider not only its result but also effects it may affect. 
Calling the `console.log` function results in not only `undefined` value but also log in the console and 
evaluating assignment expression like `a = 1` results in not only some value but also changes of the value of variable 
or the scope. If we regard shape of codes and evaluation result value of codes as extensional information(or in simple word, 'interface') of code,
we can think the other information -- like "this code will make a log in the console" or "this code will change the value of variable" -- that rises from the code while evaluation
intensional information(or in our well known term, 'side effects'). Those intensional information are matters as much as extensional information are since
no single one can be easily ignored and we programmers should mind all of them just like we treat extensional information. 
Our type system, however, only values extensional information and hardly checks possible problems that may happen because of intensional information.
All the burdens of inspecting, remembering, reasoning intensional information of code are passed to programmers.
That's why we be always bothered by errors like 'undefined is not an object' and 'unhandled promise rejection'.
Effect systems solve this giant problem. They encode intensional information of code as types so that type system can recognize and reason on intensional information.
By sharing burdens of treating intensional information (once we solely handled) with type system and its automated type checking algorithm 
we can achieve better programming experience, and better programming experience leads to many advantages like productivity.

As an effect system, hyogwa solves the problem for you. Moreover, hyogwa has the following advantages too.

- 🌿 Natural interface: No more suspicious wrapper functions, or cumbersome utilities; Write codes as you write **plain typescript code**.
- 🏃 Write once, run everywhere: You can perfectly **decouple business logics** from platform specific logics.
- 🙌 Easy effect composition: **Composing effects is done simply by making union of them**; nothing special required.
- ⏳ Time-saving minimal interface: You can start writing code right after only learning **three functions** and **two types**.
- 🧑‍💻 Advanced development experience: **Built-in coding assistant** is ready for you; it works without extra configuration.

<details>
  <summary>Read more about advantages of hyogwa (WIP)</summary>

  ### 🌿 Natural interface
  
  ### 🏃 Write once, run everywhere

  ### 🙌 Easy effect composition

  ### ⏳ Time-saving minimal interface

  ### ‍💻 Advanced development experience

</details>

## Handbook

WIP

## API

Indeed, hyogwa is a single package, but inside it's divided into four logical parts.
The core module(`hyogwa/core`) which presents essential things you need to use hyogwa,
the runner module(`hyogwa/runners`) which presents functions that run effectful computations,
built-in effect modules(`hyogwa/exception`, `hyogwa/env`, `hyogwa/log`, `hyogwa/state`) and
built-in coding assistant module(`hyogwa/assisant`) which presents static coding assistant. 
Therefore, we separated API document into four parts.

- [Essential things (`hyogwa/core`)]()
- [Effectful computations runners (`hyogwa/runners`)]()
- [Built-in effects]()
- [Built-in coding assistant (`hyogwa/assistant`)]()

### Essential things (`hyogwa/core`)

#### `Spec<N>`

##### Input
- `N` (name of the new effect): a string literal type

##### Output
- Base for the new effect of name `N`

#### `createEffect<S>(name)`

##### Input
- `S` (specification of the new effect): an effect specification
- `name` (name of the new effect): a string of the string literal type which was given to `S` when constructing via `Spec`

##### Output
- An actual representation(`Effect<S>`) of given effect specification `S`

#### `Effectful<S, R>`

##### Input
- `S` (specifications of effects possibly raise while evaluation of the computation): union of effect specifications
- `R` (a type of result of the computation): any types

##### Output
- Type of computation that may raise certain effects(`S`) and eventually result value of type `R`

#### `Handlers<S, R>`

##### Input
- `S` (specifications of effects to handle): union of effect specifications
- `R` (a type of final result of handling): any types

##### Output
- Type of handlers for given effects (`S`)

#### `handle(computation, handlers)`

#### Input
- `computation` (an effectful computation to handle some effects): value of type `Effectful<E, R>` (`E` is union of effects, `R` is result of evaluating effectful computation)
- `handlers` (effect handlers): handlers of type `Partial<Handler<E, R>>`

#### Output
- `computation`, but effects specified by `handlers` are resolved

#### `Derive<N, S>`

#### Input
- `N` (new name of the derived effect): a string literal type 
- `S` (an effect specification to derive from): an effect specification

#### Output
- New effect specification with name `N`

### Effectful computations runners (`hyogwa/runners`)

#### `run(computation)`

##### Input
- `computation` (a pure effectful computation to evaluate): value of type `Effectful<never, R>` (`R` is result of evaluating effectful computation)

##### Output
- result of evaluating given computation

#### `unsafeRunSync(computation, handlers)`

##### Input
- `computation` (an effectful computation to evaluate): value of type `Effectful<E, R>` (`E` is union of effects, `R` is result of evaluating effectful computation)
- `handlers` (handlers resolving every single effect of the given computation): handlers of type `PureHandler<E, R>` (`Handlers` but not allow handler functions to be effectful)

##### Output
- result of evaluating given computation

#### `unsafeRunAsync(computation, handlers)`

##### Input
- `computation` (an effectful computation to evaluate): value of type `Effectful<E, R>` (`E` is union of effects, `R` is result of evaluating effectful computation)
- `handlers` (handlers resolving every single effect of the given computation): handlers of type `PureHandler<E, R>` (`Handlers` but not allow handler functions to be effectful)

##### Output
- result of evaluating given computation

### Built-in effects

<details>
  <summary>WIP</summary>

  #### The exception effect (`hyogwa/exception`)

  #### The environment reference(reader) effect (`hyogwa/env`)

  #### The logging(writer) effect (`hyogwa/log`)

  #### The state effect (`hyogwa/state`)

</details>

### Built-in coding assistant (`hyogwa/assistant`)

#### `InspectEffectfulFunction<F>`

##### Input
- `F`: a type of effectful function to inspect

##### Output
- result of inspection

#### `InspectEffectHandling<C, H>`

##### Input
- `C`: a type of effectful computation
- `H`: a type of handler

##### Output
- result of inspection