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

});
