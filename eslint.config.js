import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      // Dependencies
      'node_modules/**',
      'client/node_modules/**',

      // Build outputs
      'dist/**',
      'build/**',
      'client/dist/**',
      'client/build/**',

      // Coverage reports
      'coverage/**',
      'client/coverage/**',

      // Environment files
      '.env',
      '.env.*',

      // Logs
      'logs/**',
      '*.log',

      // Cache directories
      '.cache/**',
      '.vite/**',
      'client/.vite/**',

      // Generated files
      'api-docs.json',

      // Legacy JS files that shouldn't be linted
      '*.js',
      '!eslint.config.js',
      '!client/eslint.config.js',

      // Migration files (they use CommonJS)
      'src/migrations/**',

      // Certificates
      'certificates/**',

      // Public assets
      'public/**',
      'client/public/**',

      // Docker files
      'Dockerfile*',
      'docker-compose*.yaml',

      // Git
      '.git/**',

      // IDE
      '.vscode/**',
      '.idea/**',
      '*.swp',
      '*.swo',

      // OS
      '.DS_Store',
      'Thumbs.db',

      // Additional backend-specific ignores
      'client/**/*', // Ignore all client files for backend linting
      'jest.config.js',
      'jest.setup.js',
      'migrate-mongo-config.js',
      'populate.js',
      'server/**/*.js', // Legacy JS files
      'tests/**/*',
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript Rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false, // Allow async functions in Express middleware
        },
      ],
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for most cases
      '@typescript-eslint/explicit-function-return-type': 'off', // Type inference is usually sufficient
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      "@typescript-eslint/restrict-template-expressions": "off",
      '@typescript-eslint/no-unsafe-assignment': 'off',

      // Node.js/Express specific rules
      'no-console': 'off', // Console is acceptable in Node.js
      'no-process-exit': 'error',
      'no-process-env': 'off', // Environment variables are common in Node.js

      // General JavaScript rules
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-duplicate-imports': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-promise-reject-errors': 'error',
      'require-await': 'off', // Using TypeScript version instead
      // Import/Export rules
      'no-duplicate-imports': 'error',
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],

      // Error handling
      'handle-callback-err': 'error',
      'no-mixed-requires': 'error',
      'no-new-require': 'error',
      'no-path-concat': 'error',

      // Security
      'no-buffer-constructor': 'error',
    },
  },
  // Test files configuration
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'no-console': 'off',
    },
  },
  // Migration files configuration
  {
    files: ['**/migrations/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
    },
  },
); 