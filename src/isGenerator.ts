export function isGenerator(value: unknown): value is Generator {
  if (typeof value !== 'object') return false
  if (value === null) return false
  return value.constructor === Object.getPrototypeOf(function* () {})
}