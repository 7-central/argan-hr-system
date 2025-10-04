import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import importX from 'eslint-plugin-import-x';
import prettierConfig from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

// Base configuration that applies to all files
const baseConfig = {
  plugins: {
    'import-x': importX,
  },
  rules: {
    // Allow unused variables that start with underscore
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    // ============================================
    // IMPORT ORDER ENFORCEMENT
    // ============================================
    'import-x/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: 'next',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: 'next/**',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: '@/lib/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@/components/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@/app/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@/hooks/**',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['type'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    // ============================================
    // ARCHITECTURAL LAYER SEPARATION RULES
    // ============================================
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/lib/services/business/*', '!@/lib/errors'],
            message:
              "Infrastructure layer (utils/system, middleware, database) shouldn't import from business layer! This violates layer separation. Consider using dependency injection or moving this to the business layer.",
          },
          {
            group: ['@/app/*', '!@/app/api/*'],
            message:
              "Services shouldn't import from app pages! This violates dependency direction rules. Services should be independent of the presentation layer.",
          },
        ],
        paths: [
          {
            name: '@/lib/database',
            message:
              'Use services instead of direct database access. Only *.service.ts files and database utilities should import the database directly. Consider using the appropriate service (clientService, dashboardService, authService) instead.',
          },
          {
            name: '@/lib/db',
            message:
              'Old database import pattern - this path no longer exists. Use @/lib/database in service files or use the appropriate service layer.',
          },
          {
            name: '@/lib/system/database',
            message: 'Old database path - use @/lib/database instead.',
          },
          {
            name: '@prisma/client',
            importNames: ['PrismaClient'],
            message:
              "Don't instantiate PrismaClient directly. Use the singleton from @/lib/database in service files only.",
          },
        ],
      },
    ],
  },
  settings: {
    'import-x/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import-x/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};

export default [
  // Extend Next.js configs
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Global ignore patterns
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'next-env.d.ts',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      '.vercel/**',
      'out/**',
    ],
  },

  // Apply base configuration to all TypeScript/JavaScript files
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    ...baseConfig,
  },

  // ============================================
  // EXCEPTIONS FOR SERVICE FILES
  // ============================================
  {
    files: [
      '**/*.service.ts',
      'lib/utils/system/**/*.ts',
      'lib/database/**/*.ts',
      'prisma/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*'],
              message: 'Services should not depend on app layer components or pages.',
            },
          ],
          paths: [
            {
              name: '@/lib/db',
              message: 'Old database path - use @/lib/database instead.',
            },
            {
              name: '@/lib/system/database',
              message: 'Old database path - use @/lib/database instead.',
            },
          ],
        },
      ],
    },
  },

  // ============================================
  // EXCEPTIONS FOR MIDDLEWARE FILES
  // ============================================
  {
    files: ['lib/middleware/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/services/business/*'],
              message:
                'Middleware should not import specific business services. Use dependency injection instead.',
            },
            {
              group: ['@/app/*'],
              message: 'Middleware should not depend on app layer.',
            },
          ],
          paths: [
            {
              name: '@/lib/database',
              message: 'Middleware should not directly access the database.',
            },
          ],
        },
      ],
    },
  },

  // ============================================
  // EXCEPTIONS FOR COMPONENTS AND HOOKS
  // ============================================
  {
    files: ['components/**/*.ts', 'components/**/*.tsx', 'lib/hooks/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/services/business/*', '!@/lib/errors'],
              message:
                'Components and hooks should not import business services directly. Import Server Actions from app/**/actions.ts instead, or receive them as props.',
            },
          ],
          paths: [
            {
              name: '@/lib/database',
              message:
                'Components cannot access the database. Use Server Actions or Server Components with actions.',
            },
          ],
        },
      ],
    },
  },

  // ============================================
  // EXCEPTIONS FOR SERVER ACTIONS
  // ============================================
  {
    files: ['**/actions.ts', '**/actions.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/database',
              message:
                'Server Actions should use services (clientService, dashboardService, authService) instead of direct database access.',
            },
            {
              name: '@/lib/db',
              message: 'Old database path - use services instead of direct database access.',
            },
            {
              name: '@/lib/system/database',
              message: 'Old database path - use services instead.',
            },
          ],
        },
      ],
    },
  },

  // ============================================
  // EXCEPTIONS FOR API ROUTES
  // ============================================
  {
    files: ['app/api/**/*.ts', 'app/api/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/database',
              message:
                'API routes should use services (clientService, dashboardService, authService) instead of direct database access. This maintains proper layer separation.',
            },
            {
              name: '@/lib/db',
              message: 'Old database path - use services instead of direct database access.',
            },
            {
              name: '@/lib/system/database',
              message: 'Old database path - use @/lib/database or better yet, use services.',
            },
          ],
        },
      ],
    },
  },

  // ============================================
  // EXCEPTIONS FOR AUTH ROUTES (TEMPORARY)
  // ============================================
  {
    files: ['app/api/auth/**/*.ts'],
    rules: {
      // Temporarily allow auth routes to use database directly
      // TODO: Refactor to use AuditService
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/db',
              message:
                'Old database path - use @/lib/database instead. Note: Consider refactoring to use an AuditService.',
            },
            {
              name: '@/lib/system/database',
              message:
                'Old database path - use @/lib/database instead. Note: Consider refactoring to use an AuditService.',
            },
          ],
        },
      ],
    },
  },

  // ============================================
  // EXCEPTIONS FOR TEST FILES
  // ============================================
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      // Tests can import anything for mocking purposes
      'no-restricted-imports': 'off',
      'import-x/order': 'off',
    },
  },

  // ============================================
  // EXCEPTIONS FOR SCRIPTS
  // ============================================
  {
    files: ['scripts/**/*.ts', 'scripts/**/*.js'],
    rules: {
      // Scripts are operational tools that run outside the app architecture
      // They legitimately need direct database access for migrations, seeding, password resets, etc.
      'no-restricted-imports': 'off',
    },
  },

  // ============================================
  // PRETTIER - Disable ESLint rules that conflict with Prettier
  // ============================================
  prettierConfig,
];
