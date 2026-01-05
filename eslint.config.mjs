import playcanvasConfig from '@playcanvas/eslint-config';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
    ...playcanvasConfig,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                requireConfigFile: false
            },
            globals: {
                ...globals.browser,
                ...globals.mocha,
                ...globals.node
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
            'jsdoc/require-param-type': 'off',
            'jsdoc/require-returns': 'off',
            'jsdoc/require-returns-type': 'off',
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
            'import/no-unresolved': 'off'
        }
    },
    {
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.ts', '.mjs']
                }
            }
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
