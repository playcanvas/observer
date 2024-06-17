import { Events } from './events.js';
import { Observer } from './observer.js';

/**
 * A list of observers.
 *
 * @ignore
 */
class ObserverList extends Events {
    /**
     * @param {object} [options] - Options
     * @param {boolean} [options.sorted] - Sorted
     * @param {string} [options.index] - Index
     */
    constructor(options = {}) {
        super();

        this.data = [];
        this._indexed = { };
        this.sorted = options.sorted || null;
        this.index = options.index || null;
    }

    get length() {
        return this.data.length;
    }

    get(index) {
        if (this.index) {
            return this._indexed[index] || null;
        }

        return this.data[index] || null;
    }

    set(index, value) {
        if (this.index) {
            this._indexed[index] = value;
        } else {
            this.data[index] = value;
        }
    }

    indexOf(item) {
        if (this.index) {
            const index = (item instanceof Observer && item.get(this.index)) || item[this.index];
            return (this._indexed[index] && index) || null;
        }

        const ind = this.data.indexOf(item);
        return ind !== -1 ? ind : null;
    }

    position(b, fn) {
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

    positionNextClosest(b, fn) {
        const l = this.data;
        let min = 0;
        let max = l.length - 1;
        let cur;
        let a, i;
        fn = fn || this.sorted;

        if (l.length === 0)
            return -1;

        if (fn(l[0], b) === 0)
            return 0;

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

        if (fn(a, b) === 1)
            return cur;

        if ((cur + 1) === l.length)
            return -1;

        return cur + 1;
    }

    has(item) {
        if (this.index) {
            const index = (item instanceof Observer && item.get(this.index)) || item[this.index];
            return !!this._indexed[index];
        }

        return this.data.indexOf(item) !== -1;
    }

    add(item) {
        if (this.has(item))
            return null;

        let index = this.data.length;
        if (this.index) {
            index = (item instanceof Observer && item.get(this.index)) || item[this.index];
            this._indexed[index] = item;
        }

        let pos = 0;

        if (this.sorted) {
            pos = this.positionNextClosest(item);
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
            const id = item.get(this.index);
            if (id) {
                this.emit(`add[${id}]`, item, index, pos);
            }
        }

        return pos;
    }

    move(item, pos) {
        const ind = this.data.indexOf(item);
        this.data.splice(ind, 1);
        if (pos === -1) {
            this.data.push(item);
        } else {
            this.data.splice(pos, 0, item);
        }

        this.emit('move', item, pos);
    }

    remove(item) {
        if (!this.has(item))
            return;

        const ind = this.data.indexOf(item);

        let index = ind;
        if (this.index) {
            index = (item instanceof Observer && item.get(this.index)) || item[this.index];
            delete this._indexed[index];
        }

        this.data.splice(ind, 1);

        this.emit('remove', item, index);
    }

    removeByKey(index) {
        let item;

        if (this.index) {
            item = this._indexed[index];

            if (!item)
                return;

            const ind = this.data.indexOf(item);
            this.data.splice(ind, 1);

            delete this._indexed[index];

            this.emit('remove', item, ind);
        } else {
            if (this.data.length < index)
                return;

            item = this.data[index];

            this.data.splice(index, 1);

            this.emit('remove', item, index);
        }
    }

    removeBy(fn) {
        let i = this.data.length;
        while (i--) {
            if (!fn(this.data[i]))
                continue;

            if (this.index) {
                delete this._indexed[this.data[i][this.index]];
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

    forEach(fn) {
        for (let i = 0; i < this.data.length; i++) {
            fn(this.data[i], (this.index && this.data[i][this.index]) || i);
        }
    }

    find(fn) {
        const items = [];
        for (let i = 0; i < this.data.length; i++) {
            if (!fn(this.data[i]))
                continue;

            let index = i;
            if (this.index)
                index = this.data[i][this.index];

            items.push([index, this.data[i]]);
        }
        return items;
    }

    findOne(fn) {
        for (let i = 0; i < this.data.length; i++) {
            if (!fn(this.data[i]))
                continue;

            let index = i;
            if (this.index)
                index = this.data[i][this.index];

            return [index, this.data[i]];
        }
        return null;
    }

    map(fn) {
        return this.data.map(fn);
    }

    sort(fn) {
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
