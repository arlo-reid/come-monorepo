import { config as baseConfig } from '@repo/eslint-config/base';

/**
 * ESLint configuration for NestJS applications
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // NestJS uses decorators heavily - allow unused parameters in decorated methods
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      // NestJS dependency injection often requires empty constructors
      '@typescript-eslint/no-useless-constructor': 'off',

      // Allow any type for flexibility in DTOs and dynamic configs
      '@typescript-eslint/no-explicit-any': 'warn',

      // NestJS uses classes extensively
      '@typescript-eslint/no-extraneous-class': 'off',

      // Require explicit return types on functions
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],

      // Require explicit accessibility modifiers
      '@typescript-eslint/explicit-member-accessibility': [
        'warn',
        {
          accessibility: 'explicit',
          overrides: {
            constructors: 'no-public',
          },
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
    rules: {
      // More lenient rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
