// Roman Numeral Calculator — no assigned LeetCode number — Medium
//
// Approach: regex validation + left-to-right O(n) scan.
// Roman numeral grammar is a regular language, so a single compiled pattern
// can enforce all structural rules (repeat limits, the 6 legal subtractive
// pairs, no CDCD-style repetition) in one shot before conversion runs.

// --- Constants ---

const SYMBOL_VALUES: Readonly<Record<string, number>> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
}

// Enumerated so there is no implicit "any pair where left < right is valid".
const SUBTRACTIVE_PAIRS: Readonly<Record<string, number>> = {
  IV: 4,
  IX: 9,
  XL: 40,
  XC: 90,
  CD: 400,
  CM: 900,
}

// Each segment of the regex corresponds to one decimal place, ordered
// thousands → hundreds → tens → ones. This structure is what prevents
// CDCD (the hundreds slot only appears once) and enforces the six legal
// subtractive pairs while blocking e.g. IL or VX.
const VALID_ROMAN_REGEX = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/

// --- Error class ---

export class RomanNumeralError extends Error {
  constructor(input: string, reason: string) {
    super(`'${input}' is not a valid Roman numeral: ${reason}`)
    this.name = 'RomanNumeralError'
  }
}

// --- Validation ---

/**
 * Returns true if `input` is a structurally valid Roman numeral per the
 * standard rules: symbols in descending order, correct repeat limits,
 * only the six legal subtractive pairs, and no repeated subtractive pairs.
 */
export function isValidRoman(input: string): boolean {
  if (input.length === 0) return false
  return VALID_ROMAN_REGEX.test(input)
}

// --- Conversion (assumes already-validated input) ---

/**
 * Converts a validated Roman numeral string to its integer value.
 * Precondition: `roman` has already passed `isValidRoman`.
 *
 * Left-to-right scan: if the current symbol is less than the next,
 * it forms a subtractive pair — subtract it; otherwise add it.
 */
export function convertRomanToInt(roman: string): number {
  let total = 0

  for (let index = 0; index < roman.length; index++) {
    const currentValue = SYMBOL_VALUES[roman[index]]
    const nextValue = index + 1 < roman.length ? SYMBOL_VALUES[roman[index + 1]] : 0

    if (currentValue < nextValue) {
      total -= currentValue
    } else {
      total += currentValue
    }
  }

  return total
}

// --- Public API ---

/**
 * Validates `input` as a Roman numeral, then returns its integer value.
 * Throws `RomanNumeralError` if the input is empty or structurally invalid.
 */
export function romanToInt(input: string): number {
  if (input.length === 0) {
    throw new RomanNumeralError(input, 'input must not be empty')
  }
  if (!isValidRoman(input)) {
    throw new RomanNumeralError(input, 'does not conform to standard Roman numeral rules')
  }
  return convertRomanToInt(input)
}

// --- Run ---

const validExamples: Array<{ input: string; expected: number }> = [
  { input: 'III', expected: 3 },
  { input: 'CV', expected: 105 },
  { input: 'DCXLVIII', expected: 648 },
  { input: 'MMDXLIX', expected: 2549 },
  { input: 'MCMXLIV', expected: 1944 },
  { input: 'MCMXCIX', expected: 1999 },
  { input: 'I', expected: 1 },
  { input: 'MMMCMXCIX', expected: 3999 }, // maximum representable value
]

const invalidExamples: Array<{ input: string; expectError: true }> = [
  { input: '', expectError: true },
  { input: 'IIII', expectError: true },
  { input: 'VV', expectError: true },
  { input: 'IC', expectError: true },
  { input: 'CDCD', expectError: true },
  { input: 'IL', expectError: true },
  { input: 'lowercase', expectError: true },
]

console.log('=== Valid inputs ===')
for (const { input, expected } of validExamples) {
  const result = romanToInt(input)
  const passed = result === expected
  console.log(
    `Input: ${JSON.stringify(input).padEnd(16)} | Result: ${String(result).padStart(4)} | Expected: ${String(expected).padStart(4)} | ${passed ? '✅' : '❌'}`,
  )
}

console.log('\n=== Invalid inputs (expect RomanNumeralError) ===')
for (const { input } of invalidExamples) {
  try {
    romanToInt(input)
    console.log(
      `Input: ${JSON.stringify(input).padEnd(16)} | ❌ No error thrown — should have rejected`,
    )
  } catch (error) {
    if (error instanceof RomanNumeralError) {
      console.log(`Input: ${JSON.stringify(input).padEnd(16)} | ✅ ${error.message}`)
    } else {
      throw error
    }
  }
}
