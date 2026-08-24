import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      // This codebase doesn't use PropTypes or TypeScript anywhere else — enforcing it
      // on the one component (StudentTimetable) that happens to destructure a prop
      // would be an isolated, inconsistent convention rather than a real safety net.
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // console.log leaked full user objects, UIDs, and Firestore paths into the
      // browser console across ~10 files (fixed once already) — this is the guardrail
      // that stops it from creeping back in. console.warn/console.error stay allowed.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
]
