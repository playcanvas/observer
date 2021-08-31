const umd = {
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'umd',
        name: 'observer'
    }
};

const es6 = {
    input: 'index.js',
    output: {
        file: 'dist/index.mjs',
        format: 'module'
    }
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
