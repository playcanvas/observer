import { expect } from 'chai';

import { History, Observer, ObserverHistory } from '../dist/index.mjs';

describe('ObserverHistory', () => {

    it('is enabled by default', () => {
        const history = new History();
        const item = new Observer({ a: 1 });
        const observerHistory = new ObserverHistory({ item, history });

        expect(observerHistory.enabled).to.equal(true);

        item.set('a', 2);
        expect(history.canUndo).to.equal(true);
    });

    it('can be created disabled', () => {
        const history = new History();
        const item = new Observer({ a: 1 });
        const observerHistory = new ObserverHistory({ item, history, enabled: false });

        expect(observerHistory.enabled).to.equal(false);

        item.set('a', 2);
        expect(history.canUndo).to.equal(false);
    });

    const track = (data) => {
        const history = new History();
        const item = new Observer(data);
        item.history = new ObserverHistory({ item, history });
        return { history, item };
    };

    describe('arrays', () => {

        it('undoes and redoes inserting an array value', async () => {
            const { history, item } = track({ arr: [] });

            item.insert('arr', [1, 2]);
            expect(item.get('arr')).to.deep.equal([[1, 2]]);

            await history.undo();
            expect(item.get('arr')).to.deep.equal([]);

            await history.redo();
            expect(item.get('arr')).to.deep.equal([[1, 2]]);
        });

        it('undoes and redoes removing an array value', async () => {
            const { history, item } = track({ arr: [[1], [2]] });

            item.remove('arr', 0);
            expect(item.get('arr')).to.deep.equal([[2]]);

            await history.undo();
            expect(item.get('arr')).to.deep.equal([[1], [2]]);

            await history.redo();
            expect(item.get('arr')).to.deep.equal([[2]]);
        });

        it('does not record inserting a duplicate that was not inserted', () => {
            const { history, item } = track({ arr: [1] });
            const inserts = [];
            item.on('arr:insert', value => inserts.push(value));

            expect(item.insert('arr', 1)).to.equal(false);

            expect(item.get('arr')).to.deep.equal([1]);
            expect(inserts).to.deep.equal([]);
            expect(history.canUndo).to.equal(false);
        });
    });

    describe('undo and redo', () => {

        it('leave a disabled history disabled', async () => {
            const { history, item } = track({ a: 1 });

            item.set('a', 2);
            item.history.enabled = false;

            await history.undo();
            expect(item.get('a')).to.equal(1);
            expect(item.history.enabled).to.equal(false);

            await history.redo();
            expect(item.get('a')).to.equal(2);
            expect(item.history.enabled).to.equal(false);
        });

        it('do nothing once the history is destroyed', () => {
            const actions = [];
            const item = new Observer({ a: 1 });
            item.history = new ObserverHistory({ item, history: { add: action => actions.push(action) } });

            item.set('a', 2);
            item.history.destroy();

            expect(() => actions[0].undo()).to.not.throw();
            expect(() => actions[0].redo()).to.not.throw();
            expect(item.get('a')).to.equal(2);
        });
    });

});
