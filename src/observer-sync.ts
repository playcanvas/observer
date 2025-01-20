import { Events } from './events';
import { Observer } from './observer';
import { ObserverList } from './observer-list';

/**
 * Observer sync arguments
 */
export type ObserverSyncArgs = {
    item: Observer;
    enabled?: boolean;
    prefix?: (string | number)[];
    paths?: string[];
}

/**
 * ShareDB operation
 */
export type ShareDBOperation = {
    p: (string | number)[];
    oi?: any;
    li?: any;
    lm?: any;
    od?: any;
}

/**
 * Observer sync class
 */
class ObserverSync extends Events {
    item: Observer;

    private _enabled: boolean = true;

    private _prefix: (string | number)[] = [];

    private _paths: string[] | null = null;

    constructor(args: ObserverSyncArgs) {
        super();

        this.item = args.item;
        this._enabled = args.enabled || true;
        this._prefix = args.prefix || [];
        this._paths = args.paths || null;

        this._initialize();
    }

    private _initialize() {
        const self = this;
        const item = this.item;

        // object/array set
        item.on('*:set', function (path: string, value: any, valueOld: any) {
            if (!self._enabled) return;

            // if this happens it's a bug
            if (item.sync !== self) {
                console.error('Garbage Observer Sync still pointing to item', item);
            }

            // check if path is allowed
            if (self._paths) {
                let allowedPath = false;
                for (let i = 0; i < self._paths.length; i++) {
                    if (path.indexOf(self._paths[i]) !== -1) {
                        allowedPath = true;
                        break;
                    }
                }

                // path is not allowed
                if (!allowedPath) {
                    return;
                }
            }

            // full path
            const p = self._prefix.concat(path.split('.'));

            // need jsonify
            if (value instanceof Observer || value instanceof ObserverList) {
                value = value.json();
            }

            // can be array value
            const ind = path.lastIndexOf('.');
            if (ind !== -1 && (this.get(path.slice(0, ind)) instanceof Array)) {
                // array index should be int
                p[p.length - 1] = parseInt(p[p.length - 1] as string, 10);

                // emit operation: list item set
                self.emit('op', {
                    p: p,
                    li: value,
                    ld: valueOld
                });
            } else {
                // emit operation: object item set
                const obj: {
                    p: (string | number)[];
                    oi: any;
                    od?: any;
                } = {
                    p: p,
                    oi: value
                };

                if (valueOld !== undefined) {
                    obj.od = valueOld;
                }

                self.emit('op', obj);
            }
        });

        // unset
        item.on('*:unset', (path: string, _value: any) => {
            if (!self._enabled) return;

            self.emit('op', {
                p: self._prefix.concat(path.split('.')),
                od: null
            });
        });

        // list move
        item.on('*:move', (path: string, _value: any, ind: number, indOld: number) => {
            if (!self._enabled) return;
            self.emit('op', {
                p: self._prefix.concat(path.split('.')).concat([indOld]),
                lm: ind
            });
        });

        // list remove
        item.on('*:remove', (path: string, value: any, ind: number) => {
            if (!self._enabled) return;

            // need jsonify
            if (value instanceof Observer || value instanceof ObserverList) {
                value = value.json();
            }

            self.emit('op', {
                p: self._prefix.concat(path.split('.')).concat([ind]),
                ld: value
            });
        });

        // list insert
        item.on('*:insert', (path: string, value: any, ind: number) => {
            if (!self._enabled) return;

            // need jsonify
            if (value instanceof Observer || value instanceof ObserverList) {
                value = value.json();
            }

            self.emit('op', {
                p: self._prefix.concat(path.split('.')).concat([ind]),
                li: value
            });
        });
    }

    /**
     * Write operation to the observer
     *
     * @param op - The sharedb operation
     */
    write(op: ShareDBOperation) {
        // disable history if available
        let historyReEnable = false;
        if (this.item.history && this.item.history.enabled) {
            historyReEnable = true;
            this.item.history.enabled = false;
        }

        if (op.hasOwnProperty('oi')) {
            // set key value
            const path = op.p.slice(this._prefix.length).join('.');

            this._enabled = false;
            this.item.set(path, op.oi, false, true);
            this._enabled = true;


        } else if (op.hasOwnProperty('ld') && op.hasOwnProperty('li')) {
            // set array value
            const path = op.p.slice(this._prefix.length).join('.');

            this._enabled = false;
            this.item.set(path, op.li, false, true);
            this._enabled = true;


        } else if (op.hasOwnProperty('ld')) {
            // delete item
            const path = op.p.slice(this._prefix.length, -1).join('.');
            const ind = op.p[op.p.length - 1] as number;

            this._enabled = false;
            this.item.remove(path, ind, false, true);
            this._enabled = true;


        } else if (op.hasOwnProperty('li')) {
            // add item
            const path = op.p.slice(this._prefix.length, -1).join('.');
            const ind = op.p[op.p.length - 1] as number;

            this._enabled = false;
            this.item.insert(path, op.li, ind, false, true);
            this._enabled = true;


        } else if (op.hasOwnProperty('lm')) {
            // item moved
            const path = op.p.slice(this._prefix.length, -1).join('.');
            const indOld = op.p[op.p.length - 1] as number;
            const ind = op.lm;

            this._enabled = false;
            this.item.move(path, indOld, ind, false, true);
            this._enabled = true;


        } else if (op.hasOwnProperty('od')) {
            // unset key value
            const path = op.p.slice(this._prefix.length).join('.');
            this._enabled = false;
            this.item.unset(path, false, true);
            this._enabled = true;


        } else {
            console.log('unknown operation', op);
        }

        // reenable history
        if (historyReEnable) {
            this.item.history.enabled = true;
        }

        this.emit('sync', op);
    }

    /**
     * Enabled state of the observer sync
     */
    set enabled(value) {
        this._enabled = !!value;
    }

    get enabled() {
        return this._enabled;
    }

    /**
     * Prefix of the observer sync
     */
    set prefix(value) {
        this._prefix = value || [];
    }

    get prefix() {
        return this._prefix;
    }

    /**
     * Paths of the observer sync
     */
    set paths(value) {
        this._paths = value || null;
    }

    get paths() {
        return this._paths;
    }
}

export { ObserverSync };
