import { Events } from './events';
import { Observer } from './observer';
import type { Value } from './types';

type Item = Value;

/**
 * The ObserverList class is a list of Observer objects.
 */
class ObserverList extends Events {
    data: Item[] = [];

    private _indexed!: Record<string, Item>;

    sorted: ((arg0: Item, arg1: Item) => number) | null = null;

    index: string | null = null;

    /**
     * @param options.sorted - Sorted
     * @param options.index - Index
     */
    constructor(options: { sorted?: (arg0: Item, arg1: Item) => number, index?: string } = {}) {
        super();

        // Make internal property non-enumerable so it doesn't get serialized
        Object.defineProperty(this, '_indexed', { enumerable: false, writable: true, value: {} });

        this.sorted = options.sorted || null;
        this.index = options.index || null;
    }

    get length() {
        return this.data.length;
    }

    private _itemKey(item: Item) {
        const index = this.index;
        return index && ((item instanceof Observer && item.get(index)) || item[index]);
    }

    get(index: string | number) {
        if (this.index) {
            return this._indexed[index] || null;
        }

        return this.data[index as number] || null;
    }

    set(index: string | number, value: Item) {
        if (this.index) {
            this._indexed[index] = value;
        } else {
            this.data[index as number] = value;
        }
    }

    indexOf(item: Item) {
        if (this.index) {
            const index = this._itemKey(item) as string | number;
            return (this._indexed[index] && index) || null;
        }

        const ind = this.data.indexOf(item);
        return ind !== -1 ? ind : null;
    }

    position(b: Item, fn: (arg0: Item, arg1: Item) => number) {
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

    positionNextClosest(b: Item, fn: ((arg0: Item, arg1: Item) => number)) {
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

    has(item: Item) {
        if (this.index) {
            const index = this._itemKey(item) as string | number;
            return !!this._indexed[index];
        }

        return this.data.indexOf(item) !== -1;
    }

    add(item: Item) {
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

    move(item: Item, pos: number) {
        const ind = this.data.indexOf(item);
        this.data.splice(ind, 1);
        if (pos === -1) {
            this.data.push(item);
        } else {
            this.data.splice(pos, 0, item);
        }

        this.emit('move', item, pos);
    }

    remove(item: Item) {
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

    removeBy(fn: (arg0: Item) => unknown) {
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

    forEach(fn: (arg0: Item, arg1: Value) => void) {
        for (let i = 0; i < this.data.length; i++) {
            fn(this.data[i], (this.index && this._itemKey(this.data[i])) || i);
        }
    }

    find(fn: (arg0: Item) => unknown) {
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

    findOne(fn: (arg0: Item) => unknown) {
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

    map(fn: (value: Item, index: number, array: Item[]) => Value) {
        return this.data.map(fn);
    }

    sort(fn: (a: Item, b: Item) => number) {
        this.data.sort(fn);
    }

    array() {
        return this.data.slice(0);
    }

    json() {
        const items = this.array();
        for (let i = 0; i < items.length; i++) {
            if (items[i] instanceof Observer) {
                items[i] = items[i].json();
            }
        }
        return items;
    }
}

export { ObserverList };
