import type { EventHandle } from './event-handle';
import { Events } from './events';
import type { HistoryAction } from './history';
import { Observer } from './observer';
import type { Value } from './types';

type History = {
    add: (action: HistoryAction) => void;
};

/**
 * The ObserverHistory module provides a mechanism for tracking changes to an Observer object and
 * storing them in a history stack.
 */
class ObserverHistory<T extends object = Value> extends Events {
    item: Observer<T>;

    private _history: History;

    private _enabled = true;

    private _prefix = '';

    private _combine = false;

    private _selfEvents: EventHandle[] = [];

    /**
     * @param args - Arguments
     */
    constructor(args: { item?: Observer<T>, history?: History, enabled?: boolean, prefix?: string, combine?: boolean } = {}) {
        super();

        this.item = args.item;
        this._history = args.history;
        this._enabled = args.enabled ?? true;
        this._prefix = args.prefix || '';
        this._combine = args.combine || false;

        this._initialize();
    }

    private _initialize() {
        this._selfEvents.push(this.item.on('*:set', (path: string, value: Value, valueOld: Value) => {
            if (!this._enabled || !this._history) return;

            // need jsonify
            if (value instanceof Observer) {
                value = value.json();
            }

            // action
            const action = {
                name: this._prefix + path,
                combine: this._combine,
                undo: () => {
                    this._apply((item) => {
                        if (valueOld === undefined) {
                            item.unset(path);
                        } else {
                            item.set(path, valueOld);
                        }
                    });
                },
                redo: () => {
                    this._apply((item) => {
                        if (value === undefined) {
                            item.unset(path);
                        } else {
                            item.set(path, value);
                        }
                    });
                }
            };

            this._history.add(action);
        }));

        this._selfEvents.push(this.item.on('*:unset', (path: string, valueOld: Value) => {
            if (!this._enabled || !this._history) return;

            // action
            const action = {
                name: this._prefix + path,
                combine: this._combine,
                undo: () => {
                    this._apply((item) => {
                        item.set(path, valueOld);
                    });
                },
                redo: () => {
                    this._apply((item) => {
                        item.unset(path);
                    });
                }
            };

            this._history.add(action);
        }));

        this._selfEvents.push(this.item.on('*:insert', (path: string, value: Value, ind: number) => {
            if (!this._enabled || !this._history) return;

            // need jsonify
            // if (value instanceof Observer)
            //     value = value.json();

            // action
            const action = {
                name: this._prefix + path,
                combine: this._combine,
                undo: () => {
                    this._apply((item) => {
                        item.removeValue(path, value);
                    });
                },
                redo: () => {
                    this._apply((item) => {
                        item.insert(path, value, ind);
                    });
                }
            };

            this._history.add(action);
        }));

        this._selfEvents.push(this.item.on('*:remove', (path: string, value: Value, ind: number) => {
            if (!this._enabled || !this._history) return;

            // need jsonify
            // if (value instanceof Observer)
            //     value = value.json();

            // action
            const action = {
                name: this._prefix + path,
                combine: this._combine,
                undo: () => {
                    this._apply((item) => {
                        item.insert(path, value, ind);
                    });
                },
                redo: () => {
                    this._apply((item) => {
                        item.removeValue(path, value);
                    });
                }
            };

            this._history.add(action);
        }));

        this._selfEvents.push(this.item.on('*:move', (path: string, value: Value, ind: number, indOld: number) => {
            if (!this._enabled || !this._history) return;

            // action
            const action = {
                name: this._prefix + path,
                combine: this._combine,
                undo: () => {
                    this._apply((item) => {
                        item.move(path, ind, indOld);
                    });
                },
                redo: () => {
                    this._apply((item) => {
                        item.move(path, indOld, ind);
                    });
                }
            };

            this._history.add(action);
        }));
    }

    // Applies an undo or redo to the latest version of the item with its history disabled, so the
    // change isn't recorded again, then restores the previous enabled state (even if it throws).
    // Does nothing once this history has been destroyed.
    private _apply(fn: (item: Observer<T>) => void) {
        const item = this.item?.latest();
        if (!item) return;

        const history = item.history;
        const enabled = history.enabled;
        history.enabled = false;
        try {
            fn(item);
        } finally {
            history.enabled = enabled;
        }
    }

    destroy() {
        this._selfEvents.forEach((evt) => {
            evt.unbind();
        });

        this._selfEvents.length = 0;
        this.item = null;
    }

    set enabled(value) {
        this._enabled = !!value;
    }

    get enabled() {
        return this._enabled;
    }

    set prefix(value) {
        this._prefix = value || '';
    }

    get prefix() {
        return this._prefix;
    }

    set combine(value) {
        this._combine = !!value;
    }

    get combine() {
        return this._combine;
    }
}

export { ObserverHistory };
