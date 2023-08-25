# `hyogwa/monad`

Module implementing functions needed for `Effectful` to be monad. Utilize functions here to define monad instance of 
`Effectful` when using other functional programming libraries like `fp-ts` and `fun`.

> **⚠️ CAUTION**: Strictly speaking, `Effectful` is not a monad. Evaluating the same effectful computation multiple times
> will produce unsound result. Have your code run(via `yield*`, `handle` or runners.) effectful computations only once per instance.

## `map<E, A, B>(f: (a: A) => B, computation: Effectful<E, A>): Effectful<E, B>`

Applies function to result of a computation.

## `map<A, B>(f: (a: A) => B): <E>(computation: Effectful<E, A>) => Effectful<E, B>`

Lifts given function to work with effectful computations instead of plain values

## `of<T>(value: T): Effectful<never, T>`

Makes computation of the given value

## `ap<E, A, B>(wrappedF: Effectful<E, (a: A) => B>, computation: Effectful<E, A>): Effectful<E, B>`

Applies function inside effectful computation to result of another computation.

## `ap<E1, A, B>(wrappedF: Effectful<E1, (a: A) => B>): <E2>(computation: Effectful<E2, A>) => Effectful<E1 | E2, B>`

Unwrap function inside effectful computation as function for effectful computations.

## `chain<E, A, B>(f: (a: A) => Effectful<E, B>, computation: Effectful<E, A>): Effectful<E, B>`

Applies effectful function to effectful computation.

## `chain<E1, A, B>(f: (a: A) => Effectful<E1, B>): <E2>(computation: Effectful<E2, A>) => Effectful<E1 | E2, B>`

Lifts effectful function to be function of effectful computations.