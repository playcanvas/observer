import typescript from '@rollup/plugin-typescript';

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

let targets = [cjs, esm, umd];
if (process.env.target) {
    switch (process.env.target.toLowerCase()) {
        case 'cjs':      targets = [cjs]; break;
        case 'esm':      targets = [esm]; break;
        case 'umd':      targets = [umd]; break;
    }
}

export default targets;
