import typescriptConfig from '@playcanvas/eslint-config/typescript';

export default [
    ...typescriptConfig,
    {
        files: ['**/*.mjs'],
        rules: {
            // ci lints before dist/index.mjs is built
            'import-x/no-unresolved': 'off'
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
