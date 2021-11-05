import Events from './events';
import Observer from './observer';

/**
 * @class
 * @name ObserverList
 * @param {any} options - Options
 */
class ObserverList extends Events {
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
            var index = (item instanceof Observer && item.get(this.index)) || item[this.index];
            return (this._indexed[index] && index) || null;
        }

        var ind = this.data.indexOf(item);
        return ind !== -1 ? ind : null;
    }

    position(b, fn) {
        var l = this.data;
        var min = 0;
        var max = l.length - 1;
        var cur;
        var a, i;
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
        var l = this.data;
        var min = 0;
        var max = l.length - 1;
        var cur;
        var a, i;
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
            var index = (item instanceof Observer && item.get(this.index)) || item[this.index];
            return !! this._indexed[index];
        }

        return this.data.indexOf(item) !== -1;
    }

    add(item) {
        if (this.has(item))
            return null;

        var index = this.data.length;
        if (this.index) {
            index = (item instanceof Observer && item.get(this.index)) || item[this.index];
            this._indexed[index] = item;
        }

        var pos = 0;

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
        var ind = this.data.indexOf(item);
        this.data.splice(ind, 1);
        if (pos === -1) {
            this.data.push(item);
        } else {
            this.data.splice(pos, 0, item);
        }

        this.emit('move', item, pos);
    }

    remove(item) {
        if (! this.has(item))
            return;

        var ind = this.data.indexOf(item);

        var index = ind;
        if (this.index) {
            index = (item instanceof Observer && item.get(this.index)) || item[this.index];
            delete this._indexed[index];
        }

        this.data.splice(ind, 1);

        this.emit('remove', item, index);
    }

    removeByKey(index) {
        var item;

        if (this.index) {
            item = this._indexed[index];

            if (! item)
                return;

            var ind = this.data.indexOf(item);
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
        var i = this.data.length;
        while (i--) {
            if (! fn(this.data[i]))
                continue;

            if (this.index) {
                delete this._indexed[this.data[i][this.index]];
            }
            this.data.splice(i, 1);

            this.emit('remove', this.data[i], i);
        }
    }

    clear() {
        var items = this.data.slice(0);

        this.data = [];
        this._indexed = { };

        var i = items.length;
        while (i--) {
            this.emit('remove', items[i], i);
        }
    }

    forEach(fn) {
        for (var i = 0; i < this.data.length; i++) {
            fn(this.data[i], (this.index && this.data[i][this.index]) || i);
        }
    }

    find(fn) {
        var items = [];
        for (var i = 0; i < this.data.length; i++) {
            if (! fn(this.data[i]))
                continue;

            var index = i;
            if (this.index)
                index = this.data[i][this.index];

            items.push([index, this.data[i]]);
        }
        return items;
    }

    findOne(fn) {
        for (var i = 0; i < this.data.length; i++) {
            if (! fn(this.data[i]))
                continue;

            var index = i;
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
        var items = this.array();
        for (var i = 0; i < items.length; i++) {
            if (items[i] instanceof Observer) {
                items[i] = items[i].json();
            }
        }
        return items;
    }
}

export default ObserverList;
