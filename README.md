# Observer - Observer Pattern for JS/TS

[![NPM Version](https://img.shields.io/npm/v/@playcanvas/observer)](https://www.npmjs.com/package/@playcanvas/observer)
[![NPM Downloads](https://img.shields.io/npm/dw/@playcanvas/observer)](https://npmtrends.com/@playcanvas/observer)
[![License](https://img.shields.io/npm/l/@playcanvas/observer)](https://github.com/playcanvas/observer/blob/main/LICENSE)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=flat&logo=discord&logoColor=white&color=black)](https://discord.gg/RSaMRzg)
[![Reddit](https://img.shields.io/badge/Reddit-FF4500?style=flat&logo=reddit&logoColor=white&color=black)](https://www.reddit.com/r/PlayCanvas)
[![X](https://img.shields.io/badge/X-000000?style=flat&logo=x&logoColor=white&color=black)](https://x.com/intent/follow?screen_name=playcanvas)

| [User Manual](https://developer.playcanvas.com) | [API Reference](https://api.playcanvas.com/observer) | [Blog](https://blog.playcanvas.com) | [Forum](https://forum.playcanvas.com) |

The PlayCanvas Observer is a powerful TypeScript library for managing and observing changes to objects. It allows tracking modifications to nested properties, emitting events on changes, and maintaining state consistency. This is particularly useful in applications where state management and change tracking are critical, such as in data-driven interfaces or collaborative applications.

## Installing

To install the NPM package, do:

```
npm install @playcanvas/observer --save-dev
```

## Usage

### Creating an Observer

```javascript
import Observer from '@playcanvas/observer';

const data = {
    name: 'John',
    age: 30,
    address: {
        city: 'New York',
        zip: '10001'
    }
};

const observer = new Observer(data);
```

### Listening for Changes

You can listen for changes to specific properties using the `on` method:

```javascript
observer.on('address.city:set', (newValue, oldValue) => {
    console.log(`City changed from ${oldValue} to ${newValue}`);
});

observer.set('address.city', 'San Francisco'); // Logs: City changed from New York to San Francisco
```

## Building

To generate a UMD and ESM build of the Observer library, run:

```
npm install
npm run build
```

The UMD build is `dist/index.js`. The ESM build is `dist/index.mjs`.

## API Docs

To build the API reference manual, run:

```
npm run docs
```

A pre-built API reference manual is hosted [here](https://api.playcanvas.com/observer/).
