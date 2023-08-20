/**
 * Transforms given union type into intersection type.
 *
 * @internal
 *
 * Reference: {@link https://stackoverflow.com/a/50375286}
 */
export type UnionToIntersection<U>
  = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

/**
 * A type used to mark branch of conditional type as unreachable.
 *
 * If this type shown up in the branch of conditional type, it means that case couldn't be happened.
 *
 * @internal
 */
export type Unreachable = never

/**
 * Test equality of given two types.
 *
 * If given two types are equal, returns 'true' literal type. If not, returns 'false' literal type.
 *
 * @internal
 *
 * @typeParam A - type to test equality
 * @typeParam B - type to test equality
 *
 * Reference: {@link https://stackoverflow.com/a/59346699}
 */
export type Eq<A, B>
  = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false

const DELAY_MARKER: unique symbol = Symbol('@hyogwa/delay-marker')
/**
 * Marks type not to be substituted eagerly.
 *
 * This seems to only work in some cases. Further investigation required.
 * P.S. 'null' and 'undefined' types are forbidden since current implementation couldn't support them.
 *
 * @internal
 *
 * @typeParam T - Any type to delay substitution ('null' and 'undefined' types are forbidden)
 */
export type Delay<T extends {}> = T & { [DELAY_MARKER]: never }

/**
 * Simplifies given type.
 *
 * Having typescript to eagerly compute intersection types, simplifies given type.
 * This works shallowly. In case we need more complex simplifications, then extend this utility to solve it.
 * i.e. Add 'depth' parameter like Array#flat's one to this type.
 *
 * @internal
 *
 * @typeParam T - Any type to simplify
 *
 * Reference: {@link https://github.com/microsoft/TypeScript/issues/47980#issuecomment-1049304607}
 */
export type Simplify<T> = T extends unknown ? { [K in keyof T]: T[K] } : never;

/**
 * A type guard checking whether given value is generator or not.
 *
 * @internal
 *
 * This utility applies duck-typing to distinguish generator object.
 *
 * @param value - Value to check
 * @returns boolean
 */
export function isGenerator(value: unknown): value is Generator {
  return (
    typeof value === 'object'
    && value !== null
    && Symbol.iterator in value
    && 'next' in value
    && typeof value.next === 'function'
    && 'return' in value
    && typeof value.return === 'function'
    && 'throw' in value
    && typeof value.throw === 'function'
  )
}