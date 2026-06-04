// ESLint config for the React frontend. Catches bugs before they reach the browser.
// Each `extends` entry layers more rules on top of the previous one.
// Prettier MUST come last — it turns off rules that would fight with the formatter.

import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactX from 'eslint-plugin-react-x'
import security from 'eslint-plugin-security'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Baseline JS error checks: undefined variables, duplicate declarations, etc.
      js.configs.recommended,

      // Strictest TS rules. Uses the TypeScript checker to catch bugs lint alone misses —
      // e.g. calling an async function without awaiting its Promise, or passing the wrong shape to a prop.
      ...tseslint.configs.strictTypeChecked,

      // React-specific rules: misused JSX, missing keys, dangerous patterns.
      // (react-x is the ESLint 10–compatible successor to the original eslint-plugin-react.)
      reactX.configs['recommended-typescript'],
      security.configs.recommended,

      // Rules of Hooks — fails if you call useState/useEffect conditionally or outside a component.
      reactHooks.configs.flat.recommended,

      // Keeps Vite's hot-module reload working — warns when a component file also exports non-components.
      reactRefresh.configs.vite,

      // Disables every formatting-related rule above so Prettier (not ESLint) owns formatting —
      // otherwise the two fight: ESLint adds a semicolon, Prettier strips it, repeat forever.
      // MUST be last: `extends` is processed in order, later entries override earlier ones, so any
      // plugin listed below would re-enable the formatting rules this just turned off.
      prettier,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        // Lets type-aware lint rules read the project's tsconfig automatically.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // tsc already catches unused vars (noUnusedLocals/noUnusedParameters in tsconfig.app.json).
      // Disable the ESLint version so the same error isn't reported twice.
      '@typescript-eslint/no-unused-vars': 'off',

      // Stale closures: when a useEffect/useCallback captures an old value of a variable
      // because the deps array doesn't list it. One of the most common React bugs.
      'react-hooks/exhaustive-deps': 'error',

      // Using array index as a React key breaks React's diffing when items are inserted,
      // reordered, or removed — React reuses the wrong DOM nodes. Use a stable id instead.
      'react-x/no-array-index-key': 'error',

      // Hard caps on file/function size and branching complexity — agents are blocked, not warned.
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
    },
  },

  {
    // shadcn UI primitives are copied in via the shadcn CLI and refreshed by re-running it —
    // we don't hand-author or refactor them. Skip the size/HMR caps for this folder only.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'max-lines': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  {
    // App.tsx predates the strict size limits and needs to be broken into smaller components.
    // Remove this override once App is refactored — do not add new exceptions here.
    files: ['src/App.tsx'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
])
