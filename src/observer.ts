import { Events } from './events';
import type { ObserverHistory } from './observer-history';
import type { Value } from './types';
import { arrayEquals, deepCopyArray } from './utils';

const has = (obj: Value, key: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * The ObserverSync class is used to construct an interface for synchronizing changes from Observer
 * to other services.
 */
export type ObserverSync = Events & {
    write: (...args: Value[]) => void;
    enabled: boolean;
}

type Key<T extends object> = keyof T & string;

type LatestFn<T extends object> = () => Observer<T>;

type ObserverOptions<T extends object> = {
    parent?: Observer<T>,
    parentPath?: string,
    parentField?: Value,
    parentKey?: Value,
    latestFn?: LatestFn<T>,
    pathsWithDuplicates?: string[]
};

type Schema = {
    has: (path: string) => boolean;
    get: (path: string) => { type: { name: string } };
};

type EachFn = (path: string, type: string, value: Value, key: string) => void;

/**
 * The Observer class is used to observe and manage changes to an object. It allows for tracking
 * modifications to nested properties, emitting events on changes, and maintaining state
 * consistency. This is particularly useful in applications where state management and change
 * tracking are critical, such as in data-driven interfaces or collaborative applications.
 *
 * @example
 * const data = {
 *   name: 'John',
 *   age: 30,
 *   address: {
 *     city: 'New York',
 *     zip: '10001'
 *   }
 * };
 *
 * const observer = new Observer(data);
 *
 * observer.on('name:set', (newValue, oldValue) => {
 *   console.log(`Name changed from ${oldValue} to ${newValue}`);
 * });
 *
 * observer.set('name', 'Jane'); // Logs: Name changed from John to Jane
 */
class Observer<T extends object = Record<string, Value>> extends Events {
    private _destroyed!: boolean;

    private _path!: string;

    private _keys!: string[];

    private _data!: Record<string, Value>;

    private _pathsWithDuplicates!: Set<string> | null;

    private _parent!: Observer<T> | null;

    private _parentPath!: string;

    private _parentField!: Value;

    private _parentKey!: Value;

    private _latestFn!: LatestFn<T> | null;

    private _silent!: boolean;

    history: ObserverHistory;

    sync: ObserverSync;

    schema: Schema;

    /**
     * Creates a new Observer instance.
     *
     * @param data - The initial data to observe.
     * @param options - Additional options for the observer.
     */
    constructor(data?: Partial<T>, options?: ObserverOptions<T>);
    constructor(data?: Value, options: ObserverOptions<T> = {}) {
        super();

        // Make internal properties non-enumerable so they don't get serialized
        // when the object is converted to JSON (e.g., for ShareDB sync)
        const props: [string, Value][] = [
            ['_destroyed', false],
            ['_path', ''],
            ['_keys', []],
            ['_data', {}],
            ['_pathsWithDuplicates', options.pathsWithDuplicates ? new Set(options.pathsWithDuplicates) : null],
            ['_parent', options.parent || null],
            ['_parentPath', options.parentPath || ''],
            ['_parentField', options.parentField || null],
            ['_parentKey', options.parentKey || null],
            ['_latestFn', options.latestFn || null],
            ['_silent', false]
        ];
        for (const [name, value] of props) {
            Object.defineProperty(this, name, { enumerable: false, writable: true, value });
        }

        this.patch(data);

        const propagate = function (evt: string) {
            return function (path: string, arg1: Value, arg2: Value, arg3: Value) {
                if (!this._parent) {
                    return;
                }

                let key = this._parentKey;
                if (!key && (this._parentField instanceof Array)) {
                    key = this._parentField.indexOf(this);

                    if (key === -1) {
                        return;
                    }
                }

                path = `${this._parentPath}.${key}.${path}`;

                let state;
                if (this._silent) {
                    state = this._parent.silence();
                }

                this._parent.emit(`${path}:${evt}`, arg1, arg2, arg3);
                this._parent.emit(`*:${evt}`, path, arg1, arg2, arg3);

                if (this._silent) {
                    this._parent.silenceRestore(state);
                }
            };
        };

        // propagate set
        this.on('*:set', propagate('set'));
        this.on('*:unset', propagate('unset'));
        this.on('*:insert', propagate('insert'));
        this.on('*:remove', propagate('remove'));
        this.on('*:move', propagate('move'));
    }

    // cache calls to path.split(path, '.')
    // as they take considerable time especially during loading
    // if there are a lot of observers like entities, assets etc.
    private static _splitPathsCache: Record<string, string[]> = {};

    private static _splitPath(path: string) {
        const cache = Observer._splitPathsCache;
        let result = cache[path];
        if (!result) {
            result = path.split('.');
            cache[path] = result;
        } else {
            result = result.slice();
        }

        return result;
    }

    silence(): [boolean, boolean] {
        this._silent = true;

        // history hook to prevent array values to be recorded
        const historyState = this.history && this.history.enabled;
        if (historyState) {
            this.history.enabled = false;
        }

        // sync hook to prevent array values to be recorded as array root already did
        const syncState = this.sync && this.sync.enabled;
        if (syncState) {
            this.sync.enabled = false;
        }

        return [historyState, syncState];
    }

    silenceRestore(state: [boolean, boolean]) {
        this._silent = false;

        if (state[0]) {
            this.history.enabled = true;
        }

        if (state[1]) {
            this.sync.enabled = true;
        }
    }

    private _prepare(target: Observer<T>, key: string, value: Value, silent = false, remote = false) {
        let i;
        let state;
        const path = (target._path ? (`${target._path}.`) : '') + key;
        const type = typeof value;

        target._keys.push(key);

        if (type === 'object' && (value instanceof Array)) {
            target._data[key] = value.slice(0);

            for (i = 0; i < target._data[key].length; i++) {
                if (typeof target._data[key][i] === 'object' && target._data[key][i] !== null) {
                    if (target._data[key][i] instanceof Array) {
                        target._data[key][i] = deepCopyArray(target._data[key][i]);
                    } else {
                        target._data[key][i] = new Observer(target._data[key][i], {
                            parent: this,
                            parentPath: path,
                            parentField: target._data[key],
                            parentKey: null
                        });
                    }
                } else {
                    state = this.silence();
                    this.emit(`${path}.${i}:set`, target._data[key][i], null, remote);
                    this.emit('*:set', `${path}.${i}`, target._data[key][i], null, remote);
                    this.silenceRestore(state);
                }
            }

            if (silent) {
                state = this.silence();
            }

            this.emit(`${path}:set`, target._data[key], null, remote);
            this.emit('*:set', path, target._data[key], null, remote);

            if (silent) {
                this.silenceRestore(state);
            }
        } else if (type === 'object' && (value instanceof Object)) {
            if (typeof target._data[key] !== 'object') {
                target._data[key] = {
                    _path: path,
                    _keys: [],
                    _data: { }
                };
            }

            for (i in value) {
                if (typeof value[i] === 'object') {
                    this._prepare(target._data[key], i, value[i], true, remote);
                } else {
                    state = this.silence();

                    target._data[key]._data[i] = value[i];
                    target._data[key]._keys.push(i);

                    this.emit(`${path}.${i}:set`, value[i], null, remote);
                    this.emit('*:set', `${path}.${i}`, value[i], null, remote);

                    this.silenceRestore(state);
                }
            }

            if (silent) {
                state = this.silence();
            }

            // passing undefined as valueOld here
            // but we should get the old value to be consistent
            this.emit(`${path}:set`, value, undefined, remote);
            this.emit('*:set', path, value, undefined, remote);

            if (silent) {
                this.silenceRestore(state);
            }
        } else {
            if (silent) {
                state = this.silence();
            }

            target._data[key] = value;

            this.emit(`${path}:set`, value, undefined, remote);
            this.emit('*:set', path, value, undefined, remote);

            if (silent) {
                this.silenceRestore(state);
            }
        }

        return true;
    }

    /**
     * @param path - Path to the property in the object.
     * @param value - Value to set.
     * @param silent - If true, the change will not be recorded in history.
     * @param remote - State value passed to the set event used to disable remote event emission.
     * @param force - If true, the value will be set even if it is the same as the current value.
     * @returns Returns true if the value was successfully set and false otherwise.
     */
    set<P extends string>(path: P, value: P extends Key<T> ? T[P] : Value, silent?: boolean, remote?: boolean, force?: boolean): boolean;
    set(path: string, value: Value, silent = false, remote = false, force = false) {
        let i;
        let valueOld: Value;
        let keys = Observer._splitPath(path);
        const length = keys.length;
        const key = keys[length - 1];
        let node: Value = this;
        let nodePath = '';
        let obj: Observer<T> = this;
        let state;

        for (i = 0; i < length - 1; i++) {
            if (node instanceof Array) {
                node = node[parseInt(keys[i], 10)];

                if (node instanceof Observer) {
                    path = keys.slice(i + 1).join('.');
                    obj = node;
                }
            } else {
                if (i < length && typeof node._data[keys[i]] !== 'object') {
                    if (node._data[keys[i]]) {
                        obj.unset((node._path ? `${node._path}.` : '') + keys[i]);
                    }

                    node._data[keys[i]] = {
                        _path: path,
                        _keys: [],
                        _data: { }
                    };
                    node._keys.push(keys[i]);
                }

                if (i === length - 1 && node._path) {
                    nodePath = `${node._path}.${keys[i]}`;
                }

                node = node._data[keys[i]];
            }
        }

        if (node instanceof Array) {
            const ind = parseInt(key, 10);
            if (node[ind] === value && !force) {
                return false;
            }

            valueOld = node[ind];
            if (valueOld instanceof Observer) {
                valueOld = valueOld.json();
            } else {
                valueOld = obj.json(valueOld);
            }

            node[ind] = value;

            if (value instanceof Observer) {
                value._parent = obj;
                value._parentPath = nodePath;
                value._parentField = node;
                value._parentKey = null;
            }

            if (silent) {
                state = obj.silence();
            }

            obj.emit(`${path}:set`, value, valueOld, remote);
            obj.emit('*:set', path, value, valueOld, remote);

            if (silent) {
                obj.silenceRestore(state);
            }

            return true;
        } else if (node._data && !has(node._data, key)) {
            if (typeof value === 'object') {
                return obj._prepare(node, key, value, false, remote);
            }
            node._data[key] = value;
            node._keys.push(key);

            if (silent) {
                state = obj.silence();
            }

            obj.emit(`${path}:set`, value, null, remote);
            obj.emit('*:set', path, value, null, remote);

            if (silent) {
                obj.silenceRestore(state);
            }

            return true;
        }

        if (typeof value === 'object' && (value instanceof Array)) {
            if (arrayEquals(value, node._data[key]) && !force) {
                return false;
            }

            valueOld = node._data[key];
            if (!(valueOld instanceof Observer)) {
                valueOld = obj.json(valueOld);
            }

            if (node._data[key] && node._data[key].length === value.length) {
                state = obj.silence();

                // handle new array instance
                if (value.length === 0) {
                    node._data[key] = value;
                }

                for (i = 0; i < node._data[key].length; i++) {
                    if (node._data[key][i] instanceof Observer) {
                        node._data[key][i].patch(value[i], true);
                    } else if (node._data[key][i] !== value[i]) {
                        node._data[key][i] = value[i];
                        obj.emit(`${path}.${i}:set`, node._data[key][i], valueOld && valueOld[i] || null, remote);
                        obj.emit('*:set', `${path}.${i}`, node._data[key][i], valueOld && valueOld[i] || null, remote);
                    }
                }

                obj.silenceRestore(state);
            } else {
                node._data[key] = [];
                value.forEach((val) => {
                    this._doInsert(node, key, val, undefined, true);
                });

                state = obj.silence();

                for (i = 0; i < node._data[key].length; i++) {
                    obj.emit(`${path}.${i}:set`, node._data[key][i], valueOld && valueOld[i] || null, remote);
                    obj.emit('*:set', `${path}.${i}`, node._data[key][i], valueOld && valueOld[i] || null, remote);
                }
                obj.silenceRestore(state);
            }

            if (silent) {
                state = obj.silence();
            }

            obj.emit(`${path}:set`, value, valueOld, remote);
            obj.emit('*:set', path, value, valueOld, remote);

            if (silent) {
                obj.silenceRestore(state);
            }

            return true;
        } else if (typeof value === 'object' && (value instanceof Object)) {
            let changed = false;
            valueOld = node._data[key];
            if (!(valueOld instanceof Observer)) {
                valueOld = obj.json(valueOld);
            }

            keys = Object.keys(value);

            if (!node._data[key] || !node._data[key]._data) {
                if (node._data[key]) {
                    obj.unset((node._path ? `${node._path}.` : '') + key);
                } else {
                    changed = true;
                }

                node._data[key] = {
                    _path: path,
                    _keys: [],
                    _data: { }
                };
            }

            let c;

            for (const n in node._data[key]._data) {
                if (!has(value, n)) {
                    c = obj.unset(`${path}.${n}`, true);
                    if (c) changed = true;
                } else if (has(node._data[key]._data, n)) {
                    if (!obj._equals(node._data[key]._data[n], value[n])) {
                        c = obj.set(`${path}.${n}`, value[n], true);
                        if (c) changed = true;
                    }
                } else {
                    c = obj._prepare(node._data[key], n, value[n], true, remote);
                    if (c) changed = true;
                }
            }

            for (i = 0; i < keys.length; i++) {
                if (value[keys[i]] === undefined && has(node._data[key]._data, keys[i])) {
                    c = obj.unset(`${path}.${keys[i]}`, true);
                    if (c) changed = true;
                } else if (typeof value[keys[i]] === 'object') {
                    if (has(node._data[key]._data, keys[i])) {
                        c = obj.set(`${path}.${keys[i]}`, value[keys[i]], true);
                        if (c) changed = true;
                    } else {
                        c = obj._prepare(node._data[key], keys[i], value[keys[i]], true, remote);
                        if (c) changed = true;
                    }
                } else if (!obj._equals(node._data[key]._data[keys[i]], value[keys[i]])) {
                    if (typeof value[keys[i]] === 'object') {
                        c = obj.set(`${node._data[key]._path}.${keys[i]}`, value[keys[i]], true);
                        if (c) changed = true;
                    } else if (node._data[key]._data[keys[i]] !== value[keys[i]]) {
                        changed = true;

                        if (node._data[key]._keys.indexOf(keys[i]) === -1) {
                            node._data[key]._keys.push(keys[i]);
                        }

                        node._data[key]._data[keys[i]] = value[keys[i]];

                        state = obj.silence();
                        obj.emit(`${node._data[key]._path}.${keys[i]}:set`, node._data[key]._data[keys[i]], null, remote);
                        obj.emit('*:set', `${node._data[key]._path}.${keys[i]}`, node._data[key]._data[keys[i]], null, remote);
                        obj.silenceRestore(state);
                    }
                }
            }

            if (changed) {
                if (silent) {
                    state = obj.silence();
                }

                const val = obj.json(node._data[key]);

                obj.emit(`${node._data[key]._path}:set`, val, valueOld, remote);
                obj.emit('*:set', node._data[key]._path, val, valueOld, remote);

                if (silent) {
                    obj.silenceRestore(state);
                }

                return true;
            }
            return false;
        }

        let data: Record<string, Value>;
        if (!has(node, '_data') && has(node, key)) {
            data = node;
        } else {
            data = node._data;
        }

        if (data[key] === value && !force) {
            return false;
        }

        if (silent) {
            state = obj.silence();
        }

        valueOld = data[key];
        if (!(valueOld instanceof Observer)) {
            valueOld = obj.json(valueOld);
        }

        data[key] = value;

        obj.emit(`${path}:set`, value, valueOld, remote);
        obj.emit('*:set', path, value, valueOld, remote);

        if (silent) {
            obj.silenceRestore(state);
        }

        return true;
    }

    /**
     * Query whether the object has the specified property.
     *
     * @param path - Path to the value.
     * @returns Returns true if the value is present and false otherwise.
     */
    has(path: string) {
        const keys = Observer._splitPath(path);
        let node: Value = this;
        for (let i = 0, len = keys.length; i < len; i++) {

            if (node == undefined) {
                return undefined;
            }
            if (node._data) {
                node = node._data[keys[i]];
            } else {
                node = node[keys[i]];
            }
        }

        return node !== undefined;
    }

    /**
     * @param path - Path to the value.
     * @param raw - Retrieve the observer object without converting it to JSON.
     * @returns The value at the specified path.
     */
    get<P extends string>(path: P, raw: true): Value;
    get<P extends string>(path: P, raw?: false): P extends Key<T> ? T[P] : Value;
    get(path: string, raw = false) {
        const keys = Observer._splitPath(path);
        let node: Value = this;
        for (let i = 0; i < keys.length; i++) {

            if (node == undefined) {
                return undefined;
            }

            if (node._data) {
                node = node._data[keys[i]];
            } else {
                node = node[keys[i]];
            }
        }

        if (raw) {
            return node;
        }

        if (node == null) {
            return null;
        }
        return this.json(node);

    }

    getRaw(path: string) {
        return this.get(path, true);
    }

    private _equals(a: Value, b: Value) {
        if (a === b) {
            return true;
        } else if (a instanceof Array && b instanceof Array && arrayEquals(a, b)) {
            return true;
        }
        return false;

    }

    /**
     * @param path - Path to the value.
     * @param silent - If true, the change will not be recorded in history.
     * @param remote - State value passed to the set event used to disable remote event emission.
     * @returns Returns true if the value was successfully unset and false otherwise.
     */
    unset(path: string, silent = false, remote = false) {
        let i;
        const keys = Observer._splitPath(path);
        const key = keys[keys.length - 1];
        let node = this;
        let obj = this;

        for (i = 0; i < keys.length - 1; i++) {
            if (node instanceof Array) {
                node = node[parseInt(keys[i], 10)];
                if (node instanceof Observer) {
                    path = keys.slice(i + 1).join('.');
                    obj = node;
                }
            } else {
                node = node._data[keys[i]];
            }
        }

        if (!node._data || !has(node._data, key)) {
            return false;
        }

        let valueOld = node._data[key];
        if (!(valueOld instanceof Observer)) {
            valueOld = obj.json(valueOld);
        }

        // recursive
        if (node._data[key] && node._data[key]._data) {
            // do this in reverse order because node._data[key]._keys gets
            // modified as we loop
            for (i = node._data[key]._keys.length - 1; i >= 0; i--) {
                obj.unset(`${path}.${node._data[key]._keys[i]}`, true);
            }
        }

        node._keys.splice(node._keys.indexOf(key), 1);
        delete node._data[key];

        let state;
        if (silent) {
            state = obj.silence();
        }

        obj.emit(`${path}:unset`, valueOld, remote);
        obj.emit('*:unset', path, valueOld, remote);

        if (silent) {
            obj.silenceRestore(state);
        }

        return true;
    }

    /**
     * @param path - Path to the value.
     * @param ind - Index of the value.
     * @param silent - If true, the remove event will not be emitted.
     * @param remote - State value passed to the set event used to disable remote event emission.
     * @returns Returns true if the value was successfully removed and false otherwise.
     */
    remove(path: string, ind: number, silent = false, remote = false) {
        const keys = Observer._splitPath(path);
        const key = keys[keys.length - 1];
        let node = this;
        let obj = this;

        for (let i = 0; i < keys.length - 1; i++) {
            if (node instanceof Array) {
                node = node[parseInt(keys[i], 10)];
                if (node instanceof Observer) {
                    path = keys.slice(i + 1).join('.');
                    obj = node;
                }
            } else if (node._data && has(node._data, keys[i])) {
                node = node._data[keys[i]];
            } else {
                return false;
            }
        }

        if (!node._data || !has(node._data, key) || !(node._data[key] instanceof Array)) {
            return false;
        }

        const arr = node._data[key];
        if (arr.length < ind) {
            return false;
        }

        let value = arr[ind];
        if (value instanceof Observer) {
            value._parent = null;
        } else {
            value = obj.json(value);
        }

        arr.splice(ind, 1);

        let state;
        if (silent) {
            state = obj.silence();
        }

        obj.emit(`${path}:remove`, value, ind, remote);
        obj.emit('*:remove', path, value, ind, remote);

        if (silent) {
            obj.silenceRestore(state);
        }

        return true;
    }

    /**
     * @param path - Path to the value.
     * @param value - Value to remove.
     * @param silent - If true, the remove event will not be emitted.
     * @param remote - State value passed to the set event used to disable remote event emission.
     * @returns Returns true if the value was successfully removed and false otherwise.
     */
    removeValue(path: string, value: Value, silent = false, remote = false) {
        const keys = Observer._splitPath(path);
        const key = keys[keys.length - 1];
        let node = this;
        let obj = this;

        for (let i = 0; i < keys.length - 1; i++) {
            if (node instanceof Array) {
                node = node[parseInt(keys[i], 10)];
                if (node instanceof Observer) {
                    path = keys.slice(i + 1).join('.');
                    obj = node;
                }
            } else if (node._data && has(node._data, keys[i])) {
                node = node._data[keys[i]];
            } else {
                return;
            }
        }

        if (!node._data || !has(node._data, key) || !(node._data[key] instanceof Array)) {
            return;
        }

        const arr = node._data[key];

        const ind = arr.indexOf(value);
        if (ind === -1) {
            return;
        }

        if (arr.length < ind) {
            return;
        }

        value = arr[ind];
        if (value instanceof Observer) {
            value._parent = null;
        } else {
            value = obj.json(value);
        }

        arr.splice(ind, 1);

        let state;
        if (silent) {
            state = obj.silence();
        }

        obj.emit(`${path}:remove`, value, ind, remote);
        obj.emit('*:remove', path, value, ind, remote);

        if (silent) {
            obj.silenceRestore(state);
        }

        return true;
    }

    /**
     * @param path - Path to the value.
     * @param value - Value to insert.
     * @param ind - Index to insert the value at.
     * @param silent - If true, the insert event will not be emitted.
     * @param remote - State value passed to the set event used to disable remote event emission.
     * @returns Returns true if the value was successfully inserted and false otherwise.
     */
    insert(path: string, value: Value, ind?: number, silent = false, remote = false) {
        const keys = Observer._splitPath(path);
        const key = keys[keys.length - 1];
        let node = this;
        let obj = this;

        for (let i = 0; i < keys.length - 1; i++) {
            if (node instanceof Array) {
                node = node[parseInt(keys[i], 10)];
                if (node instanceof Observer) {
                    path = keys.slice(i + 1).join('.');
                    obj = node;
                }
            } else if (node._data && has(node._data, keys[i])) {
                node = node._data[keys[i]];
            } else {
                return;
            }
        }

        if (!node._data || !has(node._data, key) || !(node._data[key] instanceof Array)) {
            return;
        }

        const arr = node._data[key];

        value = obj._doInsert(node, key, value, ind);

        if (ind === undefined) {
            ind = arr.length - 1;
        }

        let state;
        if (silent) {
            state = obj.silence();
        }

        obj.emit(`${path}:insert`, value, ind, remote);
        obj.emit('*:insert', path, value, ind, remote);

        if (silent) {
            obj.silenceRestore(state);
        }

        return true;
    }

    private _doInsert(node: Observer<T>, key: string, value: Value, ind?: number, allowDuplicates = false) {
        const arr = node._data[key];

        if (typeof value === 'object' && !(value instanceof Observer) && value !== null) {
            if (value instanceof Array) {
                value = value.slice(0);
            } else {
                value = new Observer(value);
            }
        }

        const path = node._path ? `${node._path}.${key}` : key;
        if (value !== null && !allowDuplicates && !this._pathsWithDuplicates?.has(path)) {
            if (arr.indexOf(value) !== -1) {
                return;
            }
        }

        if (ind === undefined) {
            arr.push(value);
        } else {
            arr.splice(ind, 0, value);
        }

        if (value instanceof Observer) {
            value._parent = this;
            value._parentPath = path;
            value._parentField = arr;
            value._parentKey = null;
        } else {
            value = this.json(value);
        }

        return value;
    }

    /**
     * @param path - Path to the value.
     * @param indOld - Index of the value to move.
     * @param indNew - Index to move the value to.
     * @param silent - If true, the move event will not be emitted.
     * @param remote - State value passed to the set event used to disable remote event emission.
     * @returns Returns true if the value was successfully moved and false otherwise.
     */
    move(path: string, indOld: number, indNew: number, silent = false, remote = false) {
        const keys = Observer._splitPath(path);
        const key = keys[keys.length - 1];
        let node = this;
        let obj = this;

        for (let i = 0; i < keys.length - 1; i++) {
            if (node instanceof Array) {
                node = node[parseInt(keys[i], 10)];
                if (node instanceof Observer) {
                    path = keys.slice(i + 1).join('.');
                    obj = node;
                }
            } else if (node._data && has(node._data, keys[i])) {
                node = node._data[keys[i]];
            } else {
                return;
            }
        }

        if (!node._data || !has(node._data, key) || !(node._data[key] instanceof Array)) {
            return;
        }

        const arr = node._data[key];

        if (arr.length < indOld || arr.length < indNew || indOld === indNew) {
            return;
        }

        let value = arr[indOld];

        arr.splice(indOld, 1);

        if (indNew === -1) {
            indNew = arr.length;
        }

        arr.splice(indNew, 0, value);

        if (!(value instanceof Observer)) {
            value = obj.json(value);
        }

        let state;
        if (silent) {
            state = obj.silence();
        }

        obj.emit(`${path}:move`, value, indNew, indOld, remote);
        obj.emit('*:move', path, value, indNew, indOld, remote);

        if (silent) {
            obj.silenceRestore(state);
        }

        return true;
    }

    patch(data: Partial<T>, removeMissingKeys?: boolean): void;
    patch(data: Value, removeMissingKeys = false) {
        if (typeof data !== 'object') {
            return;
        }

        for (const key in data) {
            if (typeof data[key] === 'object' && !has(this._data, key)) {
                this._prepare(this, key, data[key]);
            } else if (this._data[key] !== data[key]) {
                this.set(key, data[key]);
            }
        }

        if (removeMissingKeys) {
            for (const key in this._data) {
                if (!has(data, key)) {
                    this.unset(key);
                }
            }
        }
    }

    /**
     * @param target - The object to JSONify.
     * @returns The current state of the object tracked by the observer.
     */
    json(): T;
    json(target: Value): Value;
    json(target?: Value) {
        let key, n;
        let obj: Record<string, Value> = { };
        const node = target === undefined ? this : target;
        let len, nlen;

        if (node instanceof Object && node._keys) {
            len = node._keys.length;
            for (let i = 0; i < len; i++) {
                key = node._keys[i];
                const value = node._data[key];
                const type = typeof value;

                if (type === 'object' && (value instanceof Array)) {
                    obj[key] = value.slice(0);

                    nlen = obj[key].length;
                    for (n = 0; n < nlen; n++) {
                        if (typeof obj[key][n] === 'object') {
                            obj[key][n] = this.json(obj[key][n]);
                        }
                    }
                } else if (type === 'object' && (value instanceof Object)) {
                    obj[key] = this.json(value);
                } else {
                    obj[key] = value;
                }
            }
        } else {
            if (node === null) {
                return null;
            } else if (typeof node === 'object' && (node instanceof Array)) {
                obj = node.slice(0);

                len = obj.length;
                for (n = 0; n < len; n++) {
                    obj[n] = this.json(obj[n]);
                }
            } else if (typeof node === 'object') {
                for (key in node) {
                    if (has(node, key)) {
                        obj[key] = node[key];
                    }
                }
            } else {
                obj = node;
            }
        }
        return obj;
    }

    forEach(fn: EachFn, target?: Value, path = '') {
        const node = target || this;

        for (let i = 0; i < node._keys.length; i++) {
            const key = node._keys[i];
            const value = node._data[key];
            const type = (this.schema && this.schema.has(path + key) && this.schema.get(path + key).type.name.toLowerCase()) || typeof value;

            if (type === 'object' && (value instanceof Array)) {
                fn(path + key, 'array', value, key);
            } else if (type === 'object' && (value instanceof Object)) {
                fn(path + key, 'object', value, key);
                this.forEach(fn, value, `${path + key}.`);
            } else {
                fn(path + key, type, value, key);
            }
        }
    }

    /**
     * Returns the latest observer instance. This is important when
     * dealing with undo / redo where the observer might have been deleted
     * and/or possibly re-created.
     *
     * @returns The latest instance of the observer.
     */
    latest(): Observer<T> {
        return this._latestFn ? this._latestFn() : this;
    }

    /**
     * Destroys the observer instance.
     */
    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        this.emit('destroy');
        this.unbind();
    }

    set latestFn(value) {
        this._latestFn = value;
    }

    get latestFn() {
        return this._latestFn;
    }
}

export { Observer };
