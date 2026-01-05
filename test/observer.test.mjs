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

        // Simulate what happens when array items become nested Observers
        const child = new Observer({ name: 'child' }, { parent: parent, parentPath: 'entries', parentField: [] });

        // The child has a reference back to parent - this would cause circular reference
        // if _parent was enumerable
        expect(() => JSON.stringify(parent.json())).to.not.throw();
        expect(() => JSON.stringify(child.json())).to.not.throw();

        parent.destroy();
        child.destroy();
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

});
