import { expect } from 'chai';

import { Observer } from '../dist/index.mjs';

const getData = () => {
    return {
        name: 'Will',
        age: 46,
        isMarried: false,
        address: {
            city: 'London',
            street: 'Wall Street'
        }
    };
};

describe('Observer', () => {

    it('supports constructor with zero arguments', () => {
        const observer = new Observer();
        expect(observer).to.be.an('object');

        observer.set('key', 'hello');
        expect(observer.get('key')).to.equal('hello');

        observer.destroy();
    });

    it('supports querying of properties', () => {
        const observer = new Observer(getData());
        expect(observer).to.be.an('object');

        let result;
        result = observer.has('name');
        expect(result).to.be.true;
        result = observer.has('age');
        expect(result).to.be.true;
        result = observer.has('isMarried');
        expect(result).to.be.true;
        result = observer.has('address');
        expect(result).to.be.true;
        result = observer.has('address.city');
        expect(result).to.be.true;
        result = observer.has('address.street');
        expect(result).to.be.true;

        result = observer.has('height');
        expect(result).to.be.false;

        observer.destroy();
    });

    it('converts observer data to json', () => {
        const observer = new Observer(getData());
        const json = observer.json();
        expect(json).to.be.an('object');

        expect(json).to.have.property('name');
        expect(json).to.have.property('age');
        expect(json).to.have.property('isMarried');
        expect(json).to.have.property('address');
        expect(json.address).to.have.property('city');
        expect(json.address).to.have.property('street');

        expect(json.name).to.equal('Will');
        expect(json.age).to.equal(46);
        expect(json.isMarried).to.equal(false);
        expect(json.address).to.be.an('object');
        expect(json.address.city).to.equal('London');
        expect(json.address.street).to.equal('Wall Street');

        observer.destroy();
    });

    it('fires wildcard set event when string property is set to a new value', () => {
        const observer = new Observer(getData());

        let set = false;
        observer.on('*:set', () => {
            set = true;
        });
        observer.set('name', 'Peter');
        expect(set).to.be.true;

        observer.destroy();
    });

    it('does not fire wildcard set event when string property is set to the same value', () => {
        const observer = new Observer(getData());

        let set = false;
        observer.on('*:set', () => {
            set = true;
        });
        observer.set('name', 'Will');
        expect(set).to.be.false;

        observer.destroy();
    });

    it('fires named set event when string property is set to a new value', () => {
        const observer = new Observer(getData());

        let set = false;
        observer.on('name:set', () => {
            set = true;
        });
        observer.set('name', 'Peter');
        expect(set).to.be.true;

        observer.destroy();
    });

    it('does not fire named set event when string property is set to the same value', () => {
        const observer = new Observer(getData());

        let set = false;
        observer.on('name:set', () => {
            set = true;
        });
        observer.set('name', 'Will');
        expect(set).to.be.false;

        observer.destroy();
    });

    it('fires wildcard set event when 2 part path string property is set to a new value', () => {
        const observer = new Observer(getData());

        let set = false;
        observer.on('*:set', () => {
            set = true;
        });
        observer.set('address.city', 'Los Angeles');
        expect(set).to.be.true;

        observer.destroy();
    });

    it('does not fire wildcard set event when 2 part path string property is set to the same value', () => {
        const observer = new Observer(getData());

        let set = false;
        observer.on('*:set', () => {
            set = true;
        });
        observer.set('address.city', 'London');
        expect(set).to.be.false;

        observer.destroy();
    });

    it('has non-enumerable internal properties', () => {
        const observer = new Observer(getData());
        const keys = Object.keys(observer);

        // Events properties
        expect(keys).to.not.include('_events');
        expect(keys).to.not.include('_suspendEvents');
        expect(keys).to.not.include('_additionalEmitters');

        // Observer's own properties
        expect(keys).to.not.include('_destroyed');
        expect(keys).to.not.include('_path');
        expect(keys).to.not.include('_keys');
        expect(keys).to.not.include('_data');
        expect(keys).to.not.include('_parent');
        expect(keys).to.not.include('_parentPath');
        expect(keys).to.not.include('_parentField');
        expect(keys).to.not.include('_parentKey');
        expect(keys).to.not.include('_latestFn');
        expect(keys).to.not.include('_silent');
        expect(keys).to.not.include('_pathsWithDuplicates');

        observer.destroy();
    });

    it('can be serialized to JSON without including internal properties', () => {
        const observer = new Observer(getData());
        const jsonString = JSON.stringify(observer.json());

        expect(jsonString).to.not.include('_events');
        expect(jsonString).to.not.include('_suspendEvents');
        expect(jsonString).to.not.include('_additionalEmitters');
        expect(jsonString).to.not.include('_parent');
        expect(jsonString).to.not.include('_data');

        observer.destroy();
    });

    it('can be serialized when nested Observers have parent references', () => {
        // This tests the exact scenario from the bug: nested Observers with _parent references
        const parent = new Observer({
            entries: []
        });

        // Insert an object which becomes a nested Observer with _parent pointing back to parent
        // This creates a true circular reference:
        // - parent._data.entries[0] -> child Observer
        // - child._parent -> parent
        parent.insert('entries', { name: 'child' });

        // The nested Observer has a reference back to parent - this would cause circular reference
        // if _parent was enumerable
        expect(() => JSON.stringify(parent.json())).to.not.throw();

        // Verify the structure is correct
        const json = parent.json();
        expect(json.entries).to.have.lengthOf(1);
        expect(json.entries[0].name).to.equal('child');

        parent.destroy();
    });

    it('prevents duplicate array insertions by default', () => {
        const observer = new Observer({ items: [] });

        observer.insert('items', 'a');
        observer.insert('items', 'b');
        observer.insert('items', 'a'); // duplicate - should be ignored

        expect(observer.get('items')).to.deep.equal(['a', 'b']);

        observer.destroy();
    });

    it('allows duplicate array insertions when path is in pathsWithDuplicates', () => {
        const observer = new Observer({ items: [] }, {
            pathsWithDuplicates: ['items']
        });

        observer.insert('items', 'a');
        observer.insert('items', 'b');
        observer.insert('items', 'a'); // duplicate - should be allowed

        expect(observer.get('items')).to.deep.equal(['a', 'b', 'a']);

        observer.destroy();
    });

    describe('nested array isolation', () => {
        it('isolates nested arrays from source data modifications', () => {
            // Simulates the ShareDB scenario: source data is modified externally
            const sourceData = {
                vectors: [[1, 2, 3], [4, 5, 6]]
            };

            const observer = new Observer(sourceData);

            // Verify initial values
            expect(observer.get('vectors.0')).to.deep.equal([1, 2, 3]);
            expect(observer.get('vectors.0.0')).to.equal(1);

            // Simulate external modification (like ShareDB updating its document)
            sourceData.vectors[0][0] = 999;

            // Observer's data should NOT be affected - it should have its own copy
            expect(observer.get('vectors.0.0')).to.equal(1);
            expect(observer.get('vectors.0')).to.deep.equal([1, 2, 3]);

            observer.destroy();
        });

        it('fires set event when updating nested array element after source modification', () => {
            // This is the exact bug scenario from GitHub issue #684
            const sourceData = {
                arrayVec3: [[1, 0, 0], [0, 1, 0]]
            };

            const observer = new Observer(sourceData);

            // Simulate external modification (ShareDB updates its document)
            sourceData.arrayVec3[0][0] = -1.94;

            // Track if set event fires
            let setEventFired = false;
            let eventPath = null;
            let eventValue = null;

            observer.on('*:set', (path, value) => {
                setEventFired = true;
                eventPath = path;
                eventValue = value;
            });

            // Now set the value through the observer (like sync.write does)
            observer.set('arrayVec3.0.0', -1.94);

            // The set event SHOULD fire because the observer's internal data
            // should still be 1, not -1.94
            expect(setEventFired).to.be.true;
            expect(eventPath).to.equal('arrayVec3.0.0');
            expect(eventValue).to.equal(-1.94);

            observer.destroy();
        });

        it('maintains independent copies of deeply nested arrays', () => {
            const sourceData = {
                matrix: [
                    [[1, 2], [3, 4]],
                    [[5, 6], [7, 8]]
                ]
            };

            const observer = new Observer(sourceData);

            // Modify source at various levels
            sourceData.matrix[0][0][0] = 100;
            sourceData.matrix[1][1] = [99, 99];

            // Observer should have independent data
            expect(observer.get('matrix.0.0.0')).to.equal(1);
            expect(observer.get('matrix.1.1')).to.deep.equal([7, 8]);

            observer.destroy();
        });
    });

    describe('prototype keys', () => {

        const toString = Object.prototype.toString;
        const valueOf = Object.prototype.valueOf;

        afterEach(() => {
            // restore in case a test failed and polluted the prototype
            Object.prototype.toString = toString;
            Object.prototype.valueOf = valueOf;
        });

        it('does not write to Object.prototype through __proto__ paths', () => {
            const observer = new Observer({ a: {} });

            expect(observer.set('__proto__.toString', 'x')).to.equal(false);
            expect(observer.set('a.__proto__.valueOf', 42)).to.equal(false);
            expect(observer.unset('__proto__.toString')).to.equal(false);

            expect(Object.prototype.toString).to.equal(toString);
            expect(Object.prototype.valueOf).to.equal(valueOf);
        });

        it('ignores __proto__ keys in data', () => {
            const data = JSON.parse('{"a":{"__proto__":{"polluted":true},"b":1},"__proto__":{"polluted":true}}');
            const observer = new Observer(data);

            expect(observer.json()).to.deep.equal({ a: { b: 1 } });
            expect({}.polluted).to.equal(undefined);

            observer.patch(JSON.parse('{"__proto__":{"polluted":true},"c":2}'));
            expect(observer.get('c')).to.equal(2);
            expect({}.polluted).to.equal(undefined);
        });

        it('supports keys named after Object.prototype members', () => {
            const observer = new Observer({ constructor: 1, toString: 'x', nested: { valueOf: true } });

            expect(observer.get('constructor')).to.equal(1);
            expect(observer.get('toString')).to.equal('x');
            expect(observer.get('nested.valueOf')).to.equal(true);
            expect(observer.json()).to.deep.equal({ constructor: 1, toString: 'x', nested: { valueOf: true } });
        });

        it('treats inherited members like missing keys', () => {
            const observer = new Observer({ a: {} });

            expect(observer.has('toString')).to.equal(false);
            expect(observer.has('a.constructor')).to.equal(false);
            expect(observer.get('a.constructor')).to.equal(observer.get('a.missing'));
            expect(observer.get('__proto__')).to.equal(observer.get('missing'));
        });
    });

    describe('array indices', () => {

        const recordEvents = (observer) => {
            const events = [];
            observer.on('*:set', (path, value, valueOld) => events.push(['set', path, value, valueOld]));
            observer.on('*:remove', (path, value, ind) => events.push(['remove', path, value, ind]));
            observer.on('*:move', (path, value, ind, indOld) => events.push(['move', path, value, ind, indOld]));
            return events;
        };

        it('remove rejects an index past the end of the array', () => {
            const observer = new Observer({ big: 'doc', arr: [1, 2] });
            const events = recordEvents(observer);

            expect(observer.remove('arr', 2)).to.equal(false);
            expect(observer.get('arr')).to.deep.equal([1, 2]);
            expect(events).to.deep.equal([]);
        });

        it('remove rejects a negative index', () => {
            const observer = new Observer({ arr: [1, 2, 3] });

            expect(observer.remove('arr', -1)).to.equal(false);
            expect(observer.get('arr')).to.deep.equal([1, 2, 3]);
        });

        it('remove still removes the last element', () => {
            const observer = new Observer({ arr: [1, 2, 3] });
            const events = recordEvents(observer);

            expect(observer.remove('arr', 2)).to.equal(true);
            expect(observer.get('arr')).to.deep.equal([1, 2]);
            expect(events).to.deep.equal([['remove', 'arr', 3, 2]]);
        });

        it('move rejects a source index outside the array', () => {
            const observer = new Observer({ arr: ['a', 'b', 'c'] });

            expect(observer.move('arr', 3, 0)).to.not.equal(true);
            expect(observer.move('arr', -1, 0)).to.not.equal(true);
            expect(observer.get('arr')).to.deep.equal(['a', 'b', 'c']);
        });

        it('move to an index past the end moves to the end and reports the final index', () => {
            const observer = new Observer({ arr: ['a', 'b', 'c'] });
            const events = recordEvents(observer);

            expect(observer.move('arr', 0, 3)).to.equal(true);
            expect(observer.get('arr')).to.deep.equal(['b', 'c', 'a']);
            expect(events).to.deep.equal([['move', 'arr', 'a', 2, 0]]);

            // the reported indices can be used to move it back
            expect(observer.move('arr', 2, 0)).to.equal(true);
            expect(observer.get('arr')).to.deep.equal(['a', 'b', 'c']);
        });

        it('move to -1 still moves to the end', () => {
            const observer = new Observer({ arr: ['a', 'b', 'c'] });

            expect(observer.move('arr', 0, -1)).to.equal(true);
            expect(observer.get('arr')).to.deep.equal(['b', 'c', 'a']);
        });

        it('move rejects other negative target indices', () => {
            const observer = new Observer({ arr: ['a', 'b', 'c'] });

            expect(observer.move('arr', 0, -2)).to.not.equal(true);
            expect(observer.get('arr')).to.deep.equal(['a', 'b', 'c']);
        });

        it('set past the end of an array reports undefined as the old value', () => {
            const observer = new Observer({ big: 'doc', arr: [1] });
            const events = recordEvents(observer);

            expect(observer.set('arr.1', 2)).to.equal(true);
            expect(observer.get('arr')).to.deep.equal([1, 2]);
            expect(events).to.deep.equal([['set', 'arr.1', 2, undefined]]);
        });
    });

});
