# hyogwa — Natural 🌿 effect system that fits TypeScript

```typescript
import { Effect, createCodeConstructors } from 'hyogwa/core';
import { unsafeRunSync } from 'hyogwa/runners';

// Define own IO effect

type IO = Effect<'IO', {
  read(): string
  write(text: string): void
}>
const IO = createCodeConstructors<IO>('IO')

// Write a function with IO effect

function* main() {
  const name = yield* IO.read()

  yield* IO.write(`Welcome to hyogwa, ${name}!`)
}

// Run the function while handling IO effect

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

No more suspicious wrapper functions, no more mess with pipelines, no more scary types. 
Just plain typescript functions, and plain typescript functions only.

> **⚠️ CAUTION**: This project is work-in-progress. API is prone to change. Use at your own risk.

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
- ⏳ Time-saving minimal interface: You can start writing code right after only learning **three functions** and **one type**.
- 🧑‍💻 Advanced development experience: **Built-in coding assistant** is ready for you; it works without extra configuration.
- 🔍 Type inference friendly design: TypeScript compiler will **infer almost every type** for you; hyogwa's design is not only easy for users but also for compilers.