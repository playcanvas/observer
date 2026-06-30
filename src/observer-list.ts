import { Events } from './events';
import { Observer } from './observer';
import type { Value } from './types';

/**
 * The ObserverList class is a list of Observer objects.
 */
class ObserverList<T extends Value = Value> extends Events {
    data: T[] = [];

    private _indexed!: Record<string, T>;

    sorted: ((arg0: T, arg1: T) => number) | null = null;

    index: string | null = null;

    /**
     * @param options.sorted - Sorted
     * @param options.index - Index
     */
    constructor(options: { sorted?: (arg0: T, arg1: T) => number, index?: string } = {}) {
        super();

        // Make internal property non-enumerable so it doesn't get serialized
        Object.defineProperty(this, '_indexed', { enumerable: false, writable: true, value: {} });

        this.sorted = options.sorted || null;
        this.index = options.index || null;
    }

    get length() {
        return this.data.length;
    }

    private _itemKey(item: T) {
        const index = this.index;
        const value: Value = item;
        return index && ((item instanceof Observer && item.get(index)) || value[index]);
    }

    get(index: string | number) {
        if (this.index) {
            return this._indexed[index] || null;
        }

        return this.data[index as number] || null;
    }

    set(index: string | number, value: T) {
        if (this.index) {
            this._indexed[index] = value;
        } else {
            this.data[index as number] = value;
        }
    }

    indexOf(item: T) {
        if (this.index) {
            const index = this._itemKey(item) as string | number;
            return (this._indexed[index] && index) || null;
        }

        const ind = this.data.indexOf(item);
        return ind !== -1 ? ind : null;
    }

    position(b: T, fn: (arg0: T, arg1: T) => number) {
        const l = this.data;
        let min = 0;
        let max = l.length - 1;
        let cur;
        let a, i;
        fn = fn || this.sorted;

        while (min <= max) {
            cur = Math.floor((min + max) / 2);
            a = l[cur];

            i = fn(a, b);

            if (i === 1) {
                max = cur - 1;
            } else if (i === -1) {
                min = cur + 1;
            } else {
                return cur;
            }
        }

        return -1;
    }

    positionNextClosest(b: T, fn: ((arg0: T, arg1: T) => number)) {
        const l = this.data;
        let min = 0;
        let max = l.length - 1;
        let cur;
        let a, i;
        fn = fn || this.sorted;

        if (l.length === 0) {
            return -1;
        }

        if (fn(l[0], b) === 0) {
            return 0;
        }

        while (min <= max) {
            cur = Math.floor((min + max) / 2);
            a = l[cur];

            i = fn(a, b);

            if (i === 1) {
                max = cur - 1;
            } else if (i === -1) {
                min = cur + 1;
            } else {
                return cur;
            }
        }

        if (fn(a, b) === 1) {
            return cur;
        }

        if ((cur + 1) === l.length) {
            return -1;
        }

        return cur + 1;
    }

    has(item: T) {
        if (this.index) {
            const index = this._itemKey(item) as string | number;
            return !!this._indexed[index];
        }

        return this.data.indexOf(item) !== -1;
    }

    add(item: T) {
        if (this.has(item)) {
            return null;
        }

        let index = this.data.length;
        if (this.index) {
            index = this._itemKey(item) as number;
            this._indexed[index] = item;
        }

        let pos = 0;

        if (this.sorted) {
            pos = this.positionNextClosest(item, undefined);
            if (pos !== -1) {
                this.data.splice(pos, 0, item);
            } else {
                this.data.push(item);
            }
        } else {
            this.data.push(item);
            pos = this.data.length - 1;
        }

        this.emit('add', item, index, pos);
        if (this.index) {
            const id = this._itemKey(item);
            if (id) {
                this.emit(`add[${id}]`, item, index, pos);
            }
        }

        return pos;
    }

    move(item: T, pos: number) {
        const ind = this.data.indexOf(item);
        this.data.splice(ind, 1);
        if (pos === -1) {
            this.data.push(item);
        } else {
            this.data.splice(pos, 0, item);
        }

        this.emit('move', item, pos);
    }

    remove(item: T) {
        if (!this.has(item)) {
            return;
        }

        const ind = this.data.indexOf(item);

        let index = ind;
        if (this.index) {
            index = this._itemKey(item) as number;
            delete this._indexed[index];
        }

        this.data.splice(ind, 1);

        this.emit('remove', item, index);
    }

    removeByKey(index: string | number) {
        let item;

        if (this.index) {
            item = this._indexed[index];

            if (!item) {
                return;
            }

            const ind = this.data.indexOf(item);
            this.data.splice(ind, 1);

            delete this._indexed[index];

            this.emit('remove', item, ind);
        } else {
            const ind = index as number;
            if (this.data.length < ind) {
                return;
            }

            item = this.data[ind];

            this.data.splice(ind, 1);

            this.emit('remove', item, ind);
        }
    }

    removeBy(fn: (arg0: T) => unknown) {
        let i = this.data.length;
        while (i--) {
            if (!fn(this.data[i])) {
                continue;
            }

            if (this.index) {
                delete this._indexed[this._itemKey(this.data[i]) as string | number];
            }
            this.data.splice(i, 1);

            this.emit('remove', this.data[i], i);
        }
    }

    clear() {
        const items = this.data.slice(0);

        this.data = [];
        this._indexed = { };

        let i = items.length;
        while (i--) {
            this.emit('remove', items[i], i);
        }
    }

    forEach(fn: (arg0: T, arg1: Value) => void) {
        for (let i = 0; i < this.data.length; i++) {
            fn(this.data[i], (this.index && this._itemKey(this.data[i])) || i);
        }
    }

    find(fn: (arg0: T) => unknown) {
        const items = [];
        for (let i = 0; i < this.data.length; i++) {
            if (!fn(this.data[i])) {
                continue;
            }

            let index = i;
            if (this.index) {
                index = this._itemKey(this.data[i]) as number;
            }

            items.push([index, this.data[i]]);
        }
        return items;
    }

    findOne(fn: (arg0: T) => unknown) {
        for (let i = 0; i < this.data.length; i++) {
            if (!fn(this.data[i])) {
                continue;
            }

            let index = i;
            if (this.index) {
                index = this._itemKey(this.data[i]) as number;
            }

            return [index, this.data[i]];
        }
        return null;
    }

    map<U>(fn: (value: T, index: number, array: T[]) => U) {
        return this.data.map(fn);
    }

    sort(fn: (a: T, b: T) => number) {
        this.data.sort(fn);
    }

    array() {
        return this.data.slice(0);
    }

    json() {
        const items: Value[] = this.array();
        for (let i = 0; i < items.length; i++) {
            if (items[i] instanceof Observer) {
                items[i] = items[i].json();
            }
        }
        return items;
    }
}

export { ObserverList };
