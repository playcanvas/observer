# Observer - Observer Pattern for JS/TS

[![NPM Version][npm-version-badge]][npm-url]
[![NPM Downloads][npm-downloads-badge]][npm-trends-url]
[![License][license-badge]][license-url]
[![GitHub Actions Build Status][build-status-badge]][workflow-url]
[![Github Issue Resolve Time][issue-resolve-badge]][isitmaintained-url]
[![Github Open Issues][open-issues-badge]][isitmaintained-url]

| [User Manual][manual-url] | [API Reference][api-url] | [Blog][blog-url] | [Forum][forum-url] | [Discord][discord-url] | [Reddit][reddit-url] | [Twitter][twitter-url] |

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

[npm-version-badge]: https://img.shields.io/npm/v/@playcanvas/observer
[npm-downloads-badge]: https://img.shields.io/npm/dw/@playcanvas/observer
[license-badge]: https://img.shields.io/npm/l/@playcanvas/observer
[build-status-badge]: https://github.com/playcanvas/observer/actions/workflows/ci.yml/badge.svg
[issue-resolve-badge]: https://isitmaintained.com/badge/resolution/playcanvas/observer.svg
[open-issues-badge]: https://isitmaintained.com/badge/open/playcanvas/observer.svg

[npm-url]: https://www.npmjs.com/package/@playcanvas/observer
[npm-trends-url]: https://npmtrends.com/@playcanvas/observer
[license-url]: https://github.com/playcanvas/observer/blob/main/LICENSE
[workflow-url]: https://github.com/playcanvas/observer/actions/workflows/ci.yml
[isitmaintained-url]: https://isitmaintained.com/project/playcanvas/observer

[manual-url]: https://developer.playcanvas.com
[api-url]: https://api.playcanvas.com/observer
[blog-url]: https://blog.playcanvas.com
[forum-url]: https://forum.playcanvas.com
[discord-url]: https://discord.gg/RSaMRzg
[reddit-url]: https://www.reddit.com/r/PlayCanvas/
[twitter-url]: https://twitter.com/intent/follow?screen_name=playcanvas
