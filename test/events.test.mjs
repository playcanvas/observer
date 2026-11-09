import { expect } from 'chai';

import { Events } from '../dist/index.mjs';

describe('Events', () => {

    describe('once', () => {

        // emit() logs listener errors to the console; keep test output clean
        let info, log;
        beforeEach(() => {
            info = console.info;
            log = console.log;
            console.info = console.log = () => undefined;
        });
        afterEach(() => {
            console.info = info;
            console.log = log;
        });

        it('unbinds a listener that throws', () => {
            const events = new Events();
            let calls = 0;
            events.once('test', () => {
                calls++;
                throw new Error('listener error');
            });

            events.emit('test');
            events.emit('test');

            expect(calls).to.equal(1);
        });

        it('does not call a listener again when it re-emits the same event', () => {
            const events = new Events();
            let calls = 0;
            events.once('test', () => {
                calls++;
                if (calls < 5) {
                    events.emit('test');
                }
            });

            events.emit('test');

            expect(calls).to.equal(1);
        });
    });

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
