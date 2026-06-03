// Language Validator — Custom
//
// Algorithm: model the language as a directed labeled graph where each node
// is a letter with a set of valid outgoing edges (followers) and an isFinal
// flag. IsValid is a single left-to-right scan:
//   1. Reject if any character is not in the graph (unknown letter).
//   2. Reject if any consecutive pair (letters[i], letters[i+1]) is not a
//      valid edge.
//   3. Reject if the last character's node is not marked isFinal.
//
// Each step is O(1) with a Map + Set, so the full pass is O(k) where k = word
// length. No backtracking — the rules are deterministic per-character.

interface LetterConfig {
  followers: string[]
  isFinal: boolean
}

// Encapsulates the rules for one letter: a pre-built Set for O(1) follower
// lookup and the finality flag.
class LetterRule {
  private readonly followerSet: Set<string>
  readonly isFinal: boolean

  constructor(config: LetterConfig) {
    this.followerSet = new Set(config.followers)
    this.isFinal = config.isFinal
  }

  allowsFollower(letter: string): boolean {
    return this.followerSet.has(letter)
  }
}

// The language graph. Built once from a config map, then queried repeatedly.
class Language {
  private readonly rules: Map<string, LetterRule>

  constructor(config: Record<string, LetterConfig>) {
    this.rules = new Map(
      Object.entries(config).map(([letter, letterConfig]) => [
        letter,
        new LetterRule(letterConfig),
      ]),
    )
  }

  IsValid(word: string): boolean {
    if (word.length === 0) return false

    for (let index = 0; index < word.length; index++) {
      const currentLetter = word[index]
      const currentRule = this.rules.get(currentLetter)

      // Unknown letter — not part of this language at all.
      if (currentRule === undefined) return false

      const isLastLetter = index === word.length - 1

      if (isLastLetter) {
        return currentRule.isFinal
      }

      const nextLetter = word[index + 1]
      if (!currentRule.allowsFollower(nextLetter)) return false
    }

    // Unreachable: the loop always returns on the last iteration.
    return false
  }
}

// --- Demo ---

const language = new Language({
  a: { followers: ['a', 'b', 'd'], isFinal: true },
  b: { followers: ['a', 'f'], isFinal: false },
  c: { followers: ['a'], isFinal: true },
  d: { followers: [], isFinal: true },
  f: { followers: ['a'], isFinal: false },
})

const cases: { word: string; expected: boolean; note: string }[] = [
  // From the problem statement
  { word: 'ac', expected: false, note: "c not in a's followers" },
  { word: 'ab', expected: false, note: 'b is not final' },
  { word: 'aba', expected: true, note: 'a→b→a all valid, a is final' },

  // Edge cases
  { word: '', expected: false, note: 'empty word' },
  { word: 'a', expected: true, note: 'single final letter' },
  { word: 'b', expected: false, note: 'single non-final letter' },
  { word: 'z', expected: false, note: 'unknown letter' },
  { word: 'az', expected: false, note: 'valid start, unknown follower' },
  { word: 'd', expected: true, note: 'final letter with no followers' },
  { word: 'ad', expected: true, note: 'a→d valid, d is final' },
  { word: 'abf', expected: false, note: 'f is not final' },
  { word: 'abfa', expected: true, note: 'a→b→f→a, all transitions valid, a is final' },
  { word: 'aa', expected: true, note: 'a allows a as follower, a is final' },
  { word: 'abad', expected: true, note: 'longer valid chain a→b→a→d, d is final' },
]

for (const { word, expected, note } of cases) {
  const result = language.IsValid(word)
  const status = result === expected ? 'PASS' : 'FAIL'
  console.log(`[${status}] IsValid("${word}") = ${result} (expected ${expected}) — ${note}`)
}
