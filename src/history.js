import { Events } from './events.js';

/**
 * @typedef {object} HistoryAction
 * @property {string} name - The action name.
 * @property {Function} undo - The undo function.
 * @property {Function} redo - The redo function.
 * @property {boolean} combine Whether to combine with the previous action with the same name. The
 * effect of combining is merely changing the redo function to be the redo function of this action.
 * The original undo function is not modified.
 */

/**
 * Manages history actions for undo/redo operations. This class keeps track of actions that can be
 * undone and redone, allowing for complex state management in applications such as editors, games,
 * or any interactive applications where state changes need to be reversible.
 *
 * @example
 * const history = new History();
 *
 * // Define an action
 * const action = {
 *   name: 'draw',
 *   undo: () => { console.log('Undo draw'); },
 *   redo: () => { console.log('Redo draw'); }
 * };
 *
 * // Add the action to history
 * history.add(action);
 *
 * // Perform undo
 * history.undo();
 *
 * // Perform redo
 * history.redo();
 */
class History extends Events {
    /** @private */
    _executing = 0;

    /**
     * @type {HistoryAction[]}
     * @private
     */
    _actions = [];

    /** @private */
    _currentActionIndex = -1;

    /** @private */
    _canUndo = false;

    /** @private */
    _canRedo = false;

    /**
     * Adds a new history action to the stack. If the action has a combine flag and matches the
     * current action's name, the redo function of the current action is updated. If actions have
     * been undone before adding this new action, it removes all actions that come after the
     * current action to maintain a consistent history.
     *
     * @param {HistoryAction} action - The action to add.
     * @returns {boolean} - Returns `true` if the action is successfully added, `false` otherwise.
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

        // If an action is added after some actions have been undone, remove all actions that come
        // after the current action to ensure the history is consistent.
        if (this._currentActionIndex !== this._actions.length - 1) {
            this._actions = this._actions.slice(0, this._currentActionIndex + 1);
        }

        // If the combine flag is true and the current action has the same name, replace the redo
        // function of the current action with the new action's redo function.
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
     * Adds a new history action and immediately executes its redo function.
     *
     * @param {HistoryAction} action - The action.
     * @returns {Promise<void>} A promise that resolves once the redo function has been executed.
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
     * Undoes the last history action. This method retrieves the current action from the history
     * stack and executes the action's undo function.
     *
     * @returns {Promise<void>} A promise that resolves once the undo function has been executed.
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

        // execute an undo action - don't allow history actions until it finishes
        try {
            this.executing++;
            await undo();
        } catch (ex) {
            console.info('%c(History#undo)', 'color: #f00');
            console.log(ex.stack);
        } finally {
            this.executing--;
        }
    }

    /**
     * Redoes the next history action. This retrieves the next action from the history stack and
     * executes the action's redo function.
     *
     * @returns {Promise<void>} A promise that resolves once the redo function has been executed.
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
            console.info('%c(History#redo)', 'color: #f00');
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
     * Sets whether we can undo at this time.
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

    /**
     * Gets whether we can undo at this time.
     *
     * @type {boolean}
     */
    get canUndo() {
        return this._canUndo && !this.executing;
    }

    /**
     * Sets whether we can redo at this time.
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

    /**
     * Gets whether we can redo at this time.
     *
     * @type {boolean}
     */
    get canRedo() {
        return this._canRedo && !this.executing;
    }

    /**
     * Sets the number of async actions currently executing.
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

    /**
     * Gets the number of async actions currently executing.
     *
     * @type {number}
     */
    get executing() {
        return this._executing;
    }
}

export { History };
