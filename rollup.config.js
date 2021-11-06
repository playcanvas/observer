import babel from '@rollup/plugin-babel';

const es5Options = {
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

const moduleOptions = {
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
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'umd',
        name: 'observer'
    },
    plugins: [
        babel(es5Options)
    ]
};

const es6 = {
    input: 'index.js',
    output: {
        file: 'dist/index.mjs',
        format: 'module'
    },
    plugins: [
        babel(moduleOptions)
    ]
};

let targets;
if (process.env.target) {
    switch (process.env.target.toLowerCase()) {
        case "umd":      targets = [umd]; break;
        case "es6":      targets = [es6]; break;
        case "all":      targets = [umd, es6]; break;
    }
}

export default targets;
