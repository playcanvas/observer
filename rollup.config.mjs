import fs from 'fs';

import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

const umd = {
    input: 'src/index.ts',
    output: {
        file: 'dist/index.js',
        format: 'umd',
        name: 'observer'
    },
    plugins: [
        typescript({
            sourceMap: false
        })
    ]
};

const cjs = {
    input: 'src/index.ts',
    output: {
        file: 'dist/index.cjs',
        format: 'cjs',
        name: 'observer'
    },
    plugins: [
        typescript({
            sourceMap: false
        })
    ]
};

const esm = {
    input: 'src/index.ts',
    output: {
        file: 'dist/index.mjs',
        format: 'module'
    },
    plugins: [
        typescript({
            sourceMap: false
        })
    ]
};

// tsc emits one .d.ts per source file into .types/ (see the build:types script). Bundle them into a
// single file, as the engine does, so that the published types have no relative imports, which
// Node-style resolution (node16/nodenext) would require extensions on. The same bundle is written
// twice: index.d.ts is read as ESM (the package is "type": "module") and types the import
// condition, and index.d.cts is read as CommonJS and types the require condition, so that each
// matches the format of the JavaScript it describes.
const types = {
    input: '.types/index.d.ts',
    output: [
        {
            file: 'types/index.d.ts',
            format: 'module'
        },
        {
            file: 'types/index.d.cts',
            format: 'module'
        }
    ],
    plugins: [dts()]
};

let targets = [cjs, esm, umd];
if (process.env.target) {
    switch (process.env.target.toLowerCase()) {
        case 'cjs':      targets = [cjs]; break;
        case 'esm':      targets = [esm]; break;
        case 'umd':      targets = [umd]; break;
        case 'types':
            // Remove declarations left by earlier builds, which would otherwise be published
            fs.rmSync('types', { recursive: true, force: true });
            targets = [types];
            break;
    }
}

export default targets;
