# `hyogwa/runners`

Module of built-in runners.

## `run<R>(computation: Effectful<never, R>): R` (Re-exported from the core module)

- `R` : type of given computation's result.
- `computation` : a pure computation to evaluate.

Evaluates the given pure computation.

## `unsafeRunSync<E, R>(computation: Effectful<E, R>, handlers: ToplevelHandlers<E, R>): R`

- `E` : effects of the target computation.
- `R` : type of the target computation's result.
- `computation` : computation to run synchronously.
- `handlers` : handlers to resolve all effect of the given computation.

With the given handlers resolving every effect of the given computation, runs the given computation synchronously. Given
handlers must not raise explicit effects while handling process.

Although it's possible to give correct and clean semantic to programs written in algebraic effect style, It's not that
easy and practical. To solve this problem, hyogwa provides users unsafe runners. Transform hyogwa's explicit effects into
implicit effects using these runners at top level. This might be unsafe action, but only doing this at top level would not
harm your software that much. However, these are still unsafe things, so we gave them `unsafe-` prefix.

```typescript
import { unsafeRunSync } from 'hyogwa/runners'

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

## `unsafeRunAsync<E, R>(computation: Effectful<E, R>, handlers: UnsafeToplevelAsyncHandlers<E, R>): R`

- `E` : effects of the target computation.
- `R` : type of the target computation's result.
- `computation` : computation to run synchronously.
- `handlers` : handlers to resolve all effect of the given computation.

With the given handlers resolving every effect of the given computation, runs the given computation asynchronously. Given
handlers must not raise explicit effects while handling process, and the handlers are allowed to call handle tactics 
after they terminate. Also, it's allowed to use `Promise` objects as they are plain values in the handlers.

```typescript
import { unsafeRunAsync } from 'hyogwa/runners'

unsafeRunAsync(main(), {
  API: {
    async getUserName({ resume }) {
      const res = await fetch(/** some api endpoint */)
      const { data: name } = await res.json()
      
      resume(name)
    }
  }
})
```