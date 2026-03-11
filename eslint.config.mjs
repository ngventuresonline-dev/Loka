import nextConfig from 'eslint-config-next'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...nextConfig,
  {
    ignores: [
      '**/__tests__/**',
      '**/*.test.*',
      '**/*.spec.*',
      'k6-stress.js',
    ],
  },
  {
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
      '@next/next/no-img-element': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  },
]

