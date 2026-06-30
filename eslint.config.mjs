import typescriptConfig from '@playcanvas/eslint-config/typescript';
import globals from 'globals';

export default [
    ...typescriptConfig,
    {
        files: ['**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        rules: {
            // ci lints before dist/index.mjs is built
            'import-x/no-unresolved': 'off'
        }
    },
    {
        files: ['**/*.test.js', '**/*.test.mjs'],
        languageOptions: {
            globals: {
                ...globals.mocha
            }
        },
        rules: {
            // chai property assertions trip this rule
            '@typescript-eslint/no-unused-expressions': 'off'
        }
    },
    {
        files: ['src/events.ts', 'src/observer.ts'],
        rules: {
            // keep indexed loops in hot observer paths
            '@typescript-eslint/prefer-for-of': 'off'
        }
    },
    {
        files: ['src/observer.ts'],
        rules: {
            // path traversal rebinds the current observer context
            '@typescript-eslint/no-this-alias': 'off'
        }
    }
];
