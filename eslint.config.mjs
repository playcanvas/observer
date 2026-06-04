import typescriptConfig from '@playcanvas/eslint-config/typescript';
import globals from 'globals';

export default [
    ...typescriptConfig,
    {
        files: ['**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.mocha,
                ...globals.node
            }
        },
        rules: {
            'no-use-before-define': 'off'
        }
    },
    {
        files: ['**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        rules: {
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
            'no-unused-expressions': 'off'
        }
    }
];
