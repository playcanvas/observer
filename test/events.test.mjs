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

});
