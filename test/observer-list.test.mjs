import { expect } from 'chai';

import { Observer, ObserverList } from '../dist/index.mjs';

describe('ObserverList', () => {

    it('has non-enumerable internal properties', () => {
        const list = new ObserverList();
        const keys = Object.keys(list);

        expect(keys).to.not.include('_indexed');
        expect(keys).to.not.include('_events');
        expect(keys).to.not.include('_suspendEvents');
        expect(keys).to.not.include('_additionalEmitters');
    });

    it('can be serialized to JSON without circular reference errors', () => {
        const list = new ObserverList();
        const observer = new Observer({ id: 1, name: 'test' });
        list.add(observer);

        // This should not throw
        expect(() => JSON.stringify(list.json())).to.not.throw();

        observer.destroy();
    });

    it('supports index keys that match Object.prototype members', () => {
        const list = new ObserverList({ index: 'id' });
        const item = new Observer({ id: 'constructor' });

        expect(list.get('toString')).to.equal(null);
        expect(list.has(new Observer({ id: 'toString' }))).to.equal(false);

        expect(list.add(item)).to.equal(0);
        expect(list.get('constructor')).to.equal(item);
    });

    const ids = list => list.array().map(item => (item instanceof Observer ? item.get('id') : item));

    const recordRemoves = (list) => {
        const removed = [];
        list.on('remove', (item, index) => removed.push([item instanceof Observer ? item.get('id') : item, index]));
        return removed;
    };

    describe('remove', () => {

        it('removes the stored item when given another instance with the same key', () => {
            const list = new ObserverList({ index: 'id' });
            const a = new Observer({ id: 'a' });
            list.add(a);
            list.add(new Observer({ id: 'b' }));
            const removed = recordRemoves(list);

            list.remove(new Observer({ id: 'a' }));

            expect(ids(list)).to.deep.equal(['b']);
            expect(list.get('b')).to.not.equal(null);
            expect(list.has(a)).to.equal(false);
            expect(removed).to.deep.equal([['a', 'a']]);
        });
    });

    describe('move', () => {

        it('ignores an item that is not in the list', () => {
            const list = new ObserverList();
            list.add('a');
            list.add('b');

            list.move('missing', 0);

            expect(ids(list)).to.deep.equal(['a', 'b']);
        });
    });

    describe('removeByKey', () => {

        it('ignores an out of range position', () => {
            const list = new ObserverList();
            list.add('a');
            list.add('b');
            const removed = recordRemoves(list);

            list.removeByKey(2);
            list.removeByKey(-1);

            expect(ids(list)).to.deep.equal(['a', 'b']);
            expect(removed).to.deep.equal([]);
        });
    });

    describe('removeBy', () => {

        it('emits the removed items', () => {
            const list = new ObserverList();
            ['a', 'b', 'c'].forEach(item => list.add(item));
            const removed = recordRemoves(list);

            list.removeBy(item => item !== 'b');

            expect(ids(list)).to.deep.equal(['b']);
            expect(removed).to.deep.equal([['c', 2], ['a', 0]]);
        });
    });

    describe('sorted', () => {

        it('accepts comparators that return any negative or positive number', () => {
            const list = new ObserverList({ sorted: (a, b) => a - b });
            [30, 40, 5, 20, 50, 10].forEach(item => list.add(item));

            expect(ids(list)).to.deep.equal([5, 10, 20, 30, 40, 50]);
        });
    });

    describe('index key 0', () => {

        it('is treated as a valid key', () => {
            const list = new ObserverList({ index: 'id' });
            const zero = new Observer({ id: 0 });
            let added = false;
            list.on('add[0]', () => {
                added = true;
            });

            list.add(zero);

            expect(added).to.equal(true);
            expect(list.get(0)).to.equal(zero);
            expect(list.indexOf(zero)).to.equal(0);
            const keys = [];
            list.forEach((item, key) => keys.push(key));
            expect(keys).to.deep.equal([0]);
        });
    });

});
