import { babel } from '@rollup/plugin-babel';

const umdOptions = {
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
                    ie: "11"
                }
            }
        ]
    ]
};

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

const umd = {
    input: 'src/index.js',
    output: {
        file: 'dist/index.js',
        format: 'umd',
        name: 'observer'
    },
    plugins: [
        babel(umdOptions)
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

let targets = [umd, esm];
if (process.env.target) {
    switch (process.env.target.toLowerCase()) {
        case "umd":      targets = [umd]; break;
        case "esm":      targets = [esm]; break;
    }
}

export default targets;
