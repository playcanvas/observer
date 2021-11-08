class EventHandle {
    /**
     * @param {Events} owner - Owner
     * @param {string} name - Name
     * @param {HandleEvent} fn - Callback function
     */
    constructor(owner, name, fn) {
        this.owner = owner;
        this.name = name;
        this.fn = fn;
    }

    /**
     */
    unbind() {
        if (!this.owner)
            return;

        this.owner.unbind(this.name, this.fn);

        this.owner = null;
        this.name = null;
        this.fn = null;
    }

    /**
     */
    call() {
        if (!this.fn)
            return;

        this.fn.call(this.owner, arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7]);
    }

    /**
     * @param {string} name - Name
     * @param {HandleEvent} fn - Callback function
     * @returns {EventHandle} - EventHandle
     */
    on(name, fn) {
        return this.owner.on(name, fn);
    }
}

export default EventHandle;
