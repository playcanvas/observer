# Overview

This repository contains classes used across the PlayCanvas Editor and PCUI. These classes are used in data binding and history (undo, redo).

# Installing

To build a UMD module of the library run:
```
npm install
npm run build
```

The built file will be a UMD module located at `dist/index.js`.

# Events

Base class for event emitters. Allows emitting events and attaching event handlers.

# Observer

Responsible for editing an object that contains JSON data. The class emits events when properties change.

# ObserverList

A list of observers with similar functionality and events.

# ObserverHistory

Records undo / redo when an Observer changes.

# History

Responsible for keeping track of history actions (for undo / redo).
