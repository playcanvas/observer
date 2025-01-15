import { babel } from '@rollup/plugin-babel';

const esmOptions = {
    babelHelpers: 'bundled',
    babelrc: false,
    comments: false,
    compact: false,
    minified: false,
    presets: [
        [
            '@babel/preset-env', {
                bugfixes: true,
                loose: true,
                modules: false,
                targets: {
                    esmodules: true
                }
            }
        ]
    ]
};

const nonEsmOptions = {
    babelHelpers: 'bundled',
    babelrc: false,
    comments: false,
    compact: false,
    minified: false,
    presets: [
        [
            '@babel/preset-env', {
                loose: true,
                modules: false,
                targets: {
                    ie: '11'
                }
            }
        ]
    ]
};

const umd = {
    input: 'src/index.js',
    output: {
        file: 'dist/index.js',
        format: 'umd',
        name: 'observer'
    },
    plugins: [
        babel(nonEsmOptions)
    ]
};

const cjs = {
    input: 'src/index.js',
    output: {
        file: 'dist/index.cjs',
        format: 'cjs',
        name: 'observer'
    },
    plugins: [
        babel(nonEsmOptions)
    ]
};

const esm = {
    input: 'src/index.js',
    output: {
        file: 'dist/index.mjs',
        format: 'module'
    },
    plugins: [
        babel(esmOptions)
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
