---
name: leetcode-patterns
description: Problems solved and algorithmic patterns used in the leetcode session
metadata:
  type: project
---

## Problems solved

| Slug | File | LeetCode # | Pattern |
|------|------|-----------|---------|
| add-two-numbers | server/leetcode/add-two-numbers.ts | #2 | Simultaneous linked-list traversal + carry propagation |
| reverse-integer | server/leetcode/reverse-integer.ts | #7 | Digit extraction via modulo + pre-overflow guard |
| container-with-most-water | server/leetcode/container-with-most-water.ts | #11 | Two pointers from both ends, advance shorter side |

## Patterns noted

**Dummy head node** — used in add-two-numbers to avoid special-casing the first node when building a result linked list. `const dummyHead = new ListNode(0); return dummyHead.next` is the idiomatic TS/JS pattern.

**Carry propagation loop condition** — `while (l1 !== null || l2 !== null || carry !== 0)` is the correct termination condition; the `carry !== 0` clause handles the case where the final sum produces an extra digit (e.g., 5+5=10 → extra node `[0,1]`).

**Helper pattern** — `arrayToList` / `listToArray` helpers are included in every linked-list file to make the run block readable without polluting the solution function.

**Two-pointer shrink from both ends** — used in container-with-most-water. Start `leftIndex = 0`, `rightIndex = n-1`. At each step advance whichever pointer has the shorter line. Key invariant: moving the taller pointer can never increase area (the bounded height can only stay the same or drop, and width strictly decreases), so the only productive move is to advance the shorter side.

**Pre-overflow detection without 64-bit integers** — used in reverse-integer. Before doing `result = result * 10 + digit`, compare `result` against `floor(INT_MAX / 10)`. If `result` is already greater, multiplying by 10 overflows. If `result` equals the threshold, check the incoming digit against the last digit of INT_MAX (7) or INT_MIN magnitude (8). JavaScript `%` preserves sign for negatives, so the negative branch works symmetrically with a negative digit and negative threshold.

**Math.trunc vs Math.floor for integer division on negatives** — `Math.trunc(-123 / 10) = -12` (truncates toward zero, correct); `Math.floor(-123 / 10) = -13` (floors toward negative infinity, wrong for digit stripping). Always use `Math.trunc` when stripping digits from a potentially negative integer.

## Conventions established

- Files live at `server/leetcode/<problem-slug>.ts`
- Every file is standalone-runnable with `npx tsx server/leetcode/<slug>.ts`
- Test harness uses a typed `examples` array with `input`/`expected` (or named fields per problem) and prints pass/fail with checkmarks
