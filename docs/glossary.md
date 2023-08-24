# Glossary for hyogwa

While reading documents of hyogwa or its code, you may find words you're not familiar of.
Or there might be some words that need consensus before make use of them. 
For example, definition of 'side effect' is so. 
Meaning of the word 'side effect' varies over context therefore we need to make consent.
So, here, we organized those kinds of words in this file to help everyone who wants to use/contribute hyogwa.

## Effects

Effects(Computational effects) are intensional information of computations(or abstractions, which are consisted of computations) that have noticeable impact on evaluation context.
Borders to discriminate what are effects and what are not depends on context.

### Implicit effects

Implicit effects(Unspecified effects) are effects that aren't integrated into interface of abstractions or computations.

### Effect specifications

Effect specifications are object types whose methods and properties represent primitive constructions of effectful computation of the kind.

### Effect specification templates

Generic types(type constructors) that produces effect specifications.

### Effectful computations

Effectful computations are computations which involve computational effects while evaluation. 
In hyogwa, they are represented as generators yielding 

## Handlers

Handlers are objects that maps names of effectful computation construction to values and functions that implement actual interpretation/semantic.

### Handle tactics

Handle tactics are functions to determine how the effectful computation consequently handled.

## Runners

Runners are functions that evaluates a computation and may result in a value while creating noticeable change to processing context.
Hyogwa provides built-in runners with `hyogwa/runners` module.