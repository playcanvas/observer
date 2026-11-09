import { expect } from 'chai';

import { Events } from '../dist/index.mjs';

describe('Events', () => {

    it('has non-enumerable internal properties', () => {
        const events = new Events();
        const keys = Object.keys(events);

        expect(keys).to.not.include('_events');
        expect(keys).to.not.include('_suspendEvents');
        expect(keys).to.not.include('_additionalEmitters');
    });

    it('can be serialized to JSON without circular reference errors', () => {
        const events1 = new Events();
        const events2 = new Events();

        // Create a scenario that would cause circular reference if _additionalEmitters was enumerable
        events1.addEmitter(events2);
        events2.addEmitter(events1);

        // This should not throw
        expect(() => JSON.stringify(events1)).to.not.throw();
        expect(() => JSON.stringify(events2)).to.not.throw();
    });

    it('supports event names that match Object.prototype members', () => {
        const events = new Events();
        const calls = [];

        events.emit('constructor');
        events.on('toString', value => calls.push(value));
        events.emit('toString', 1);
        events.unbind('toString');
        events.emit('toString', 2);

        expect(calls).to.deep.equal([1]);
    });

});
