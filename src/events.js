import { EventHandle } from './event-handle.js';

/**
 * @callback HandleEvent
 * Callback used by {@link Events} and {@link EventHandle} functions. Note the callback is limited to 8 arguments.
 * @param {any} [arg1] - First argument that is passed from caller.
 * @param {any} [arg2] - Second argument that is passed from caller.
 * @param {any} [arg3] - Third argument that is passed from caller.
 * @param {any} [arg4] - Fourth argument that is passed from caller.
 * @param {any} [arg5] - Fifth argument that is passed from caller.
 * @param {any} [arg6] - Sixth argument that is passed from caller.
 * @param {any} [arg7] - Seventh argument that is passed from caller.
 * @param {any} [arg8] - Eighth argument that is passed from caller.
 */

/**
 * Base class for event handling, providing mechanisms to register, emit, and unbind events. This
 * class supports adding event listeners, emitting events with up to 8 arguments, and managing
 * multiple emitters.
 *
 * @example
 * // Create an instance of the Events class
 * const events = new Events();
 *
 * // Register an event listener
 * events.on('testEvent', (arg1, arg2) => {
 *     console.log('Event triggered with arguments:', arg1, arg2);
 * });
 *
 * // Emit the event
 * events.emit('testEvent', 'value1', 'value2');
 *
 * // Unbind the event listener
 * events.unbind('testEvent');
 */
class Events {
    /** @private */
    _suspendEvents = false;

    /**
     * @type {Events[]}
     * @private
     */
    _additionalEmitters = [];

    /**
     * Creates a new Events instance.
     */
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
    }

    /**
     * Sets whether events are suspended. If true, the observer will not emit events when values
     * are set.
     *
     * @type {boolean}
     */
    set suspendEvents(value) {
        this._suspendEvents = !!value;
    }

    /**
     * Gets whether events are suspended.
     *
     * @type {boolean}
     */
    get suspendEvents() {
        return this._suspendEvents;
    }

    /**
     * Registers an event listener for the specified event name. If the event is emitted,
     * the callback function is executed with up to 8 arguments.
     *
     * @param {string} name - The name of the event to listen for.
     * @param {HandleEvent} fn - The callback function to be executed when the event is emitted.
     * @returns {EventHandle} An EventHandle object that can be used to unbind the event listener.
     *
     * @example
     * // Register an event listener
     * events.on('testEvent', (arg1, arg2) => {
     *     console.log('Event triggered with arguments:', arg1, arg2);
     * });
     *
     * // Emit the event
     * events.emit('testEvent', 'value1', 'value2');
     */
    on(name, fn) {
        const events = this._events[name];
        if (events === undefined) {
            this._events[name] = [fn];
        } else {
            if (events.indexOf(fn) === -1) {
                events.push(fn);
            }
        }
        return new EventHandle(this, name, fn);
    }

    /**
     * Registers a one-time event listener for the specified event name. The callback function is
     * executed the next time the event is emitted, and then automatically unbound.
     *
     * @param {string} name - The name of the event to listen for.
     * @param {HandleEvent} fn - The callback function to be executed once when the event is emitted.
     * @returns {EventHandle} An EventHandle object that can be used to unbind the event listener
     * before it is triggered.
     *
     * @example
     * // Register a one-time event listener
     * events.once('testEvent', (arg1, arg2) => {
     *     console.log('Event triggered once with arguments:', arg1, arg2);
     * });
     *
     * // Emit the event
     * events.emit('testEvent', 'value1', 'value2'); // The callback will be called and then unbound.
     *
     * // Emit the event again
     * events.emit('testEvent', 'value1', 'value2'); // The callback will not be called this time.
     */
    once(name, fn) {
        const evt = this.on(name, (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) => {
            fn.call(this, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
            evt.unbind();
        });
        return evt;
    }

    /**
     * Emits the specified event, executing all registered listeners for that event with the
     * provided arguments. If events are suspended, the emit operation will be ignored.
     *
     * @param {string} name - The name of the event to emit.
     * @param {any} [arg0] - The first argument to pass to the event listeners.
     * @param {any} [arg1] - The second argument to pass to the event listeners.
     * @param {any} [arg2] - The third argument to pass to the event listeners.
     * @param {any} [arg3] - The fourth argument to pass to the event listeners.
     * @param {any} [arg4] - The fifth argument to pass to the event listeners.
     * @param {any} [arg5] - The sixth argument to pass to the event listeners.
     * @param {any} [arg6] - The seventh argument to pass to the event listeners.
     * @param {any} [arg7] - The eighth argument to pass to the event listeners.
     * @returns {Events} The current instance for chaining.
     *
     * @example
     * // Register an event listener
     * events.on('testEvent', (arg1, arg2) => {
     *     console.log('Event triggered with arguments:', arg1, arg2);
     * });
     *
     * // Emit the event
     * events.emit('testEvent', 'value1', 'value2');
     *
     * // Emit the event with more arguments
     * events.emit('testEvent', 'value1', 'value2', 'value3', 'value4');
     */
    emit(name, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        if (this._suspendEvents) return this;

        let events = this._events[name];
        if (events && events.length) {
            events = events.slice(0);

            for (let i = 0; i < events.length; i++) {
                if (!events[i]) {
                    continue;
                }

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
     * Unbinds an event listener for the specified event name. If a callback function is provided,
     * only that specific listener is removed. If no callback is provided, all listeners for the
     * event are removed. If no event name is provided, all listeners for all events are removed.
     *
     * @param {string} [name] - The name of the event to unbind. If not provided, all events are
     * unbound.
     * @param {HandleEvent} [fn] - The specific callback function to remove. If not provided, all
     * listeners for the event are removed.
     * @returns {Events} The current instance for chaining.
     *
     * @example
     * // Register an event listener
     * const callback = (arg1, arg2) => {
     *     console.log('Event triggered with arguments:', arg1, arg2);
     * };
     * events.on('testEvent', callback);
     *
     * // Unbind the specific event listener
     * events.unbind('testEvent', callback);
     *
     * // Unbind all listeners for a specific event
     * events.unbind('testEvent');
     *
     * // Unbind all listeners for all events
     * events.unbind();
     */
    unbind(name, fn) {
        if (name) {
            const events = this._events[name];
            if (!events) {
                return this;
            }

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
     * Adds another emitter. Any events fired by this instance will also be fired on the additional
     * emitter.
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

export { Events };
