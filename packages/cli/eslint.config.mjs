// @ts-check
import { nestJsConfig } from '@repo/eslint-config/nestjs';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nestJsConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
