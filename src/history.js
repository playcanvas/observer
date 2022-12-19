import Events from './events.js';

/**
 * @name HistoryAction
 * @class
 * @classdesc A history action
 * @property {string} name The name of the action
 * @property {Function} undo The undo function
 * @property {Function} redo The redo function
 * @property {boolean} combine Whether to combine with the previous action with the same name.
 * The effect of combining is merely changing the redo function to be the redo function of this action.
 * The original undo function is not modified.
 */

/**
 * Manages history actions for undo / redo operations.
 *
 * @augments Events
 */
class History extends Events {
    _executing = 0;

    /**
     * Creates a new History.
     */
    constructor() {
        super();

        this._actions = [];
        this._currentActionIndex = -1;
        this._canUndo = false;
        this._canRedo = false;

    }

    /**
     * Adds a new history action
     *
     * @param {HistoryAction} action - The action
     * @returns {boolean} - Returns `true` if an action is added
     */
    add(action) {
        if (!action.name) {
            console.error('Trying to add history action without name');
            return false;
        }

        if (!action.undo) {
            console.error('Trying to add history action without undo method', action.name);
            return false;
        }

        if (!action.redo) {
            console.error('Trying to add history action without redo method', action.name);
            return false;
        }

        // if we are adding an action
        // but we have undone some actions in the meantime
        // then we should erase the actions that come after our
        // last action before adding this
        if (this._currentActionIndex !== this._actions.length - 1) {
            this._actions = this._actions.slice(0, this._currentActionIndex + 1);
        }

        // if combine is true then replace the redo of the current action
        // if it has the same name
        if (action.combine && this.currentAction && this.currentAction.name === action.name) {
            this.currentAction.redo = action.redo;
        } else {
            const length = this._actions.push(action);
            this._currentActionIndex = length - 1;
        }

        this.emit('add', action.name);

        this.canUndo = true;
        this.canRedo = false;

        return true;
    }

    /**
     * Add a new history action and execute redo after that
     *
     * @param {HistoryAction} action - The action
     */
    async addAndExecute(action) {
        if (this.add(action)) {
            // execute an action - don't allow history actions till it finishes
            try {
                this.executing++;
                await action.redo();
            } finally {
                this.executing--;
            }
        }
    }

    /**
     * Undo the last history action
     */
    async undo() {
        if (!this.canUndo)
            return;

        const name = this.currentAction.name;
        const undo = this.currentAction.undo;
        this._currentActionIndex--;

        this.emit('undo', name);

        if (this._currentActionIndex < 0) {
            this.canUndo = false;
        }

        this.canRedo = true;

        // execute an undo action - don't allow history actions till it finishes
        try {
            this.executing++;
            await undo();
        } catch (ex) {
            console.info('%c(pcui.History#undo)', 'color: #f00');
            console.log(ex.stack);
        } finally {
            this.executing--;
        }
    }

    /**
     * Redo the current history action
     */
    async redo() {
        if (!this.canRedo)
            return;

        this._currentActionIndex++;
        const redo = this.currentAction.redo;
        this.emit('redo', this.currentAction.name);

        this.canUndo = true;

        if (this._currentActionIndex === this._actions.length - 1) {
            this.canRedo = false;
        }

        // execute redo action - don't allow history actions till it finishes
        try {
            this.executing++;
            await redo();
        } catch (ex) {
            console.info('%c(pcui.History#redo)', 'color: #f00');
            console.log(ex.stack);
        } finally {
            this.executing--;
        }
    }

    /**
     * Clears all history actions.
     */
    clear() {
        if (!this._actions.length) return;

        this._actions.length = 0;
        this._currentActionIndex = -1;

        this.canUndo = false;
        this.canRedo = false;
    }

    /**
     * The current history action.
     *
     * @type {HistoryAction}
     */
    get currentAction() {
        return this._actions[this._currentActionIndex] || null;
    }

    /**
     * The last action committed to the history.
     *
     * @type {HistoryAction}
     */
    get lastAction() {
        return this._actions[this._actions.length - 1] || null;
    }

    /**
     * Whether we can undo at this time.
     *
     * @type {boolean}
     */
    set canUndo(value) {
        if (this._canUndo === value) return;
        this._canUndo = value;
        if (!this.executing) {
            this.emit('canUndo', value);
        }
    }

    get canUndo() {
        return this._canUndo && !this.executing;
    }

    /**
     * Whether we can redo at this time.
     *
     * @type {boolean}
     */
    set canRedo(value) {
        if (this._canRedo === value) return;
        this._canRedo = value;
        if (!this.executing) {
            this.emit('canRedo', value);
        }
    }

    get canRedo() {
        return this._canRedo && !this.executing;
    }

    /**
     * he number of async actions currently executing.
     *
     * @type {number}
     */
    set executing(value) {
        if (this._executing === value) return;
        this._executing = value;

        if (this._executing) {
            this.emit('canUndo', false);
            this.emit('canRedo', false);
        } else {
            this.emit('canUndo', this._canUndo);
            this.emit('canRedo', this._canRedo);
        }
    }

    get executing() {
        return this._executing;
    }
}

export default History;
