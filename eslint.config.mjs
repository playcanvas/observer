import typescriptConfig from '@playcanvas/eslint-config/typescript';

export default [
    ...typescriptConfig,
    {
        files: ['**/*.mjs', 'test/types/**/*.ts'],
        rules: {
            // ci lints before dist/index.mjs and types/index.d.ts are built
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
