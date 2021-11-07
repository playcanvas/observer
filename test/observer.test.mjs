import Observer from '../src/observer.js';

import { expect } from 'chai';

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

describe("Observer", () => {

    it('supports constructor with zero arguments', () => {
        const observer = new Observer();
        expect(observer).to.be.an('object');
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
    });

    it('fires wildcard set event when string property is set to a new value', () => {
        const observer = new Observer(getData());
        let set = false;
        observer.on('*:set', () => {
            set = true;
        });
        observer.set('name', 'Peter');
        expect(set).to.be.true;
    });

    it('does not fire wildcard set event when string property is set to the same value', () => {
        const observer = new Observer(getData());
        let set = false;
        observer.on('*:set', () => {
            set = true;
        });
        observer.set('name', 'Will');
        expect(set).to.be.false;
    });

    it('fires named set event when string property is set to a new value', () => {
        const observer = new Observer(getData());
        let set = false;
        observer.on('name:set', () => {
            set = true;
        });
        observer.set('name', 'Peter');
        expect(set).to.be.true;
    });

    it('does not fire named set event when string property is set to the same value', () => {
        const observer = new Observer(getData());
        let set = false;
        observer.on('name:set', () => {
            set = true;
        });
        observer.set('name', 'Will');
        expect(set).to.be.false;
    });

    it('fires wildcard set event when 2 part path string property is set to a new value', () => {
        const observer = new Observer(getData());
        let set = false;
        observer.on('*:set', () => {
            set = true;
        });
        observer.set('address.city', 'Los Angeles');
        expect(set).to.be.true;
    });

    it('does not fire wildcard set event when 2 part path string property is set to the same value', () => {
        const observer = new Observer(getData());
        let set = false;
        observer.on('*:set', () => {
            set = true;
        });
        observer.set('address.city', 'London');
        expect(set).to.be.false;
    });
});
