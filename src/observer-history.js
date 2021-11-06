import Events from './events.js';
import Observer from './observer.js';

/**
 * @class
 * @name ObserverHistory
 * @param {any} args - Arguments
 */
class ObserverHistory extends Events {
    constructor(args = {}) {
        super();

        this.item = args.item;
        this._history = args.history;
        this._enabled = args.enabled || true;
        this._prefix = args.prefix || '';
        this._combine = args.combine || false;

        this._events = [];

        this._initialize();
    }

    _initialize() {
        this._events.push(this.item.on('*:set', (path, value, valueOld) => {
            if (!this._enabled || !this._history) return;

            // need jsonify
            if (value instanceof Observer)
                value = value.json();

            // action
            const action = {
                name: this._prefix + path,
                combine: this._combine,
                undo: () => {
                    const item = this.item.latest();
                    if (!item) return;

                    item.history.enabled = false;

                    if (valueOld === undefined) {
                        item.unset(path);
                    } else {
                        item.set(path, valueOld);
                    }

                    item.history.enabled = true;
                },
                redo: () => {
                    const item = this.item.latest();
                    if (!item) return;

                    item.history.enabled = false;

                    if (value === undefined) {
                        item.unset(path);
                    } else {
                        item.set(path, value);
                    }

                    item.history.enabled = true;
                }
            };

            this._history.add(action);
        }));

        this._events.push(this.item.on('*:unset', (path, valueOld) => {
            if (!this._enabled || !this._history) return;

            // action
            const action = {
                name: this._prefix + path,
                combine: this._combine,
                undo: () => {
                    const item = this.item.latest();
                    if (!item) return;

                    item.history.enabled = false;
                    item.set(path, valueOld);
                    item.history.enabled = true;
                },
                redo: () => {
                    const item = this.item.latest();
                    if (!item) return;

                    item.history.enabled = false;
                    item.unset(path);
                    item.history.enabled = true;
                }
            };

            this._history.add(action);
        }));

        this._events.push(this.item.on('*:insert', (path, value, ind) => {
            if (!this._enabled || !this._history) return;

            // need jsonify
            // if (value instanceof Observer)
            //     value = value.json();

            // action
            const action = {
                name: this._prefix + path,
                combine: this._combine,
                undo: () => {
                    const item = this.item.latest();
                    if (!item) return;

                    item.history.enabled = false;
                    item.removeValue(path, value);
                    item.history.enabled = true;
                },
                redo: () => {
                    const item = this.item.latest();
                    if (!item) return;

                    item.history.enabled = false;
                    item.insert(path, value, ind);
                    item.history.enabled = true;
                }
            };

            this._history.add(action);
        }));

        this._events.push(this.item.on('*:remove', (path, value, ind) => {
            if (!this._enabled || !this._history) return;

            // need jsonify
            // if (value instanceof Observer)
            //     value = value.json();

            // action
            const action = {
                name: this._prefix + path,
                combine: this._combine,
                undo: () => {
                    const item = this.item.latest();
                    if (!item) return;

                    item.history.enabled = false;
                    item.insert(path, value, ind);
                    item.history.enabled = true;
                },
                redo: () => {
                    const item = this.item.latest();
                    if (!item) return;

                    item.history.enabled = false;
                    item.removeValue(path, value);
                    item.history.enabled = true;
                }
            };

            this._history.add(action);
        }));

        this._events.push(this.item.on('*:move', (path, value, ind, indOld) => {
            if (!this._enabled || !this._history) return;

            // action
            const action = {
                name: this._prefix + path,
                combine: this._combine,
                undo: () => {
                    const item = this.item.latest();
                    if (!item) return;

                    item.history.enabled = false;
                    item.move(path, ind, indOld);
                    item.history.enabled = true;
                },
                redo: () => {
                    const item = this.item.latest();
                    if (!item) return;

                    item.history.enabled = false;
                    item.move(path, indOld, ind);
                    item.history.enabled = true;
                }
            };

            this._history.add(action);
        }));
    }

    destroy() {
        this._events.forEach((evt) => {
            evt.unbind();
        });

        this._events.length = 0;
        this.item = null;
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(value) {
        this._enabled = !!value;
    }

    get prefix() {
        return this._prefix;
    }

    set prefix(value) {
        this._prefix = value || '';
    }

    get combine() {
        return this._combine;
    }

    set combine(value) {
        this._combine = !!value;
    }
}

export default ObserverHistory;
