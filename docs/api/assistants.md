# `hyogwa/assistants`

Collection of built-in coding assistants.

## `InspectEffectfulFunction<G>`

- `G` : type of any effectful function to inspect.

Checks whether the function is valid effectful function, and infers effects used in the function and type of function's
result. Save inspection result in the form of type alias, view it via IDE extension or using typescript compiler by
making error about it deliberately.

```typescript
type Inspection = InspectEffectfulFunction<typeof functionToInspect>
```

## `InspectEffectHandling<C, H>`

- `C` : type of the effectful computation to inspect
- `H` : type of the handlers to apply

Checks whether the handlers are applicable. If not, reports potential problems it may have. Or else, infers result of
applying the handlers. Save inspection result in the form of type alias, view it via IDE extension or using typescript
compiler by making error about it deliberately.

```typescript
type Inspection = InspectEffectHandling<typeof computationToHandle, typeof handlerToUse>
```