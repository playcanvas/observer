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

});
