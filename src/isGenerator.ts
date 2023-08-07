export function isGenerator(value: unknown): value is Generator {
  if (typeof value !== 'object') return false
  if (value === null) return false
  if (typeof Object.getPrototypeOf(value) !== 'function') return false
  return typeof Object.getPrototypeOf(Object.getPrototypeOf(value)) === Object.getPrototypeOf(function* () {})
}