import EventHandle from './event-handle.js';

/**
 * @callback HandleEvent
 * Callback used by {@link Events} and {@link EventHandle} functions. Note the callback is limited to 8 arguments.
 * @param {*} [arg1] - First argument that is passed from caller.
 * @param {*} [arg2] - Second argument that is passed from caller.
 * @param {*} [arg3] - Third argument that is passed from caller.
 * @param {*} [arg4] - Fourth argument that is passed from caller.
 * @param {*} [arg5] - Fifth argument that is passed from caller.
 * @param {*} [arg6] - Sixth argument that is passed from caller.
 * @param {*} [arg7] - Seventh argument that is passed from caller.
 * @param {*} [arg8] - Eighth argument that is passed from caller.
 */

/**
 * Base class for event handling.
 */
class Events {
    constructor() {
        // _world
        Object.defineProperty(
            this,
            '_events', {
                enumerable: false,
                configurable: false,
                writable: true,
                value: { }
            }
        );

        this._suspendEvents = false;

        this._additionalEmitters = [];
    }

    /**
     * If true the observer will not emit events when values are set.
     *
     * @type {boolean}
     */
    set suspendEvents(value) {
        this._suspendEvents = !!value;
    }

    get suspendEvents() {
        return this._suspendEvents;
    }

    /**
     * @param {string} name - Name
     * @param {HandleEvent} fn - Callback function
     * @returns {EventHandle} EventHandle
     */
    on(name, fn) {
        const events = this._events[name];
        if (events === undefined) {
            this._events[name] = [fn];
        } else {
            if (events.indexOf(fn) === -1)
                events.push(fn);
        }
        return new EventHandle(this, name, fn);
    }

    /**
     * @param {string} name - Name
     * @param {HandleEvent} fn - Callback function
     * @returns {EventHandle} EventHandle
     */
    once(name, fn) {
        const evt = this.on(name, (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) => {
            fn.call(this, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
            evt.unbind();
        });
        return evt;
    }

    /**
     * @param {string} name - Name
     * @param {*} [arg0] - First argument
     * @param {*} [arg1] - Second argument
     * @param {*} [arg2] - Third argument
     * @param {*} [arg3] - Fourth argument
     * @param {*} [arg4] - Fifth argument
     * @param {*} [arg5] - Sixth argument
     * @param {*} [arg6] - Seventh argument
     * @param {*} [arg7] - Eights argument
     * @returns {Events} Self for chaining.
     */
    emit(name, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        if (this._suspendEvents) return;

        let events = this._events[name];
        if (events && events.length) {
            events = events.slice(0);

            for (let i = 0; i < events.length; i++) {
                if (!events[i])
                    continue;

                try {
                    events[i].call(this, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
                } catch (ex) {
                    console.info('%c%s %c(event error)', 'color: #06f', name, 'color: #f00');
                    console.log(ex.stack);
                }
            }
        }

        if (this._additionalEmitters.length) {
            const emitters = this._additionalEmitters.slice();
            emitters.forEach((emitter) => {
                emitter.emit(name, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
            });
        }

        return this;
    }

    /**
     * @param {string} name - Name
     * @param {HandleEvent} fn - Callback function
     * @returns {Events} - This
     */
    unbind(name, fn) {
        if (name) {
            const events = this._events[name];
            if (!events)
                return this;

            if (fn) {
                const i = events.indexOf(fn);
                if (i !== -1) {
                    if (events.length === 1) {
                        delete this._events[name];
                    } else {
                        events.splice(i, 1);
                    }
                }
            } else {
                delete this._events[name];
            }
        } else {
            this._events = { };
        }

        return this;
    }

    /**
     * Adds another emitter. Any events fired by this instance
     * will also be fired on the additional emitter.
     *
     * @param {Events} emitter - The emitter
     */
    addEmitter(emitter) {
        if (!this._additionalEmitters.includes(emitter)) {
            this._additionalEmitters.push(emitter);
        }
    }

    /**
     * Removes emitter.
     *
     * @param {Events} emitter - The emitter
     */
    removeEmitter(emitter) {
        const idx = this._additionalEmitters.indexOf(emitter);
        if (idx !== -1) {
            this._additionalEmitters.splice(idx, 1);
        }
    }
}

export default Events;
