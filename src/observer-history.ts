import { EventHandle } from './event-handle';
import { Events } from './events';
import { Observer } from './observer';

/**
 * History for an observer.
 */
class ObserverHistory extends Events {
    item: any;

    private _history: any;

    private _enabled: boolean = true;

    private _prefix: string = '';

    private _combine: boolean = false;

    private _selfEvents: EventHandle[] = [];

    /**
     * @param args - Arguments
     */
    constructor(args: { item?: any, history?: any, enabled?: boolean, prefix?: string, combine?: boolean } = {}) {
        super();

        this.item = args.item;
        this._history = args.history;
        this._enabled = args.enabled || true;
        this._prefix = args.prefix || '';
        this._combine = args.combine || false;

        this._initialize();
    }

    private _initialize() {
        this._selfEvents.push(this.item.on('*:set', (path: string, value: any, valueOld: any) => {
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

        this._selfEvents.push(this.item.on('*:unset', (path: string, valueOld: any) => {
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

        this._selfEvents.push(this.item.on('*:insert', (path: string, value: any, ind: number) => {
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

        this._selfEvents.push(this.item.on('*:remove', (path: string, value: any, ind: number) => {
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

        this._selfEvents.push(this.item.on('*:move', (path: string, value: any, ind: number, indOld: number) => {
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
