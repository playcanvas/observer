# Observer - Observer Pattern for JS/TS

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/playcanvas/observer/blob/main/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@playcanvas/observer.svg?style=flat?style=flat)](https://www.npmjs.com/package/@playcanvas/observer)
[![NPM Downloads](https://img.shields.io/npm/dw/@playcanvas/observer)](https://npmtrends.com/@playcanvas/observer)

| [API Reference](https://api.playcanvas.com/observer/) | [Blog](https://blog.playcanvas.com/) | [Forum](https://forum.playcanvas.com/) | [Discord](https://discord.gg/RSaMRzg) |

# Overview

The PlayCanvas Observer is a powerful TypeScript library for managing and observing changes to objects. It allows tracking modifications to nested properties, emitting events on changes, and maintaining state consistency. This is particularly useful in applications where state management and change tracking are critical, such as in data-driven interfaces or collaborative applications.

## Installing

To install the NPM package, do:

    npm install @playcanvas/observer --save-dev

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

    npm install
    npm run build

The UMD build is `dist/index.js`. The ESM build is `dist/index.mjs`.

## API Docs

To build the API reference manual, run:

    npm run docs

A pre-built API reference manual is hosted [here](https://api.playcanvas.com/observer/).
