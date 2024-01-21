/**
 * The Observer module provides a robust implementation of the observer pattern, an essential
 * mechanism for event handling and data binding in complex applications. It allows for creating
 * observable objects that notify registered observers automatically whenever changes occur. This
 * module is instrumental in developing reactive interfaces and facilitating communication between
 * different parts of an application, enhancing modularity and responsiveness.
 *
 * @module Observer
 */

import Events from './src/events';
import Observer from './src/observer';
import ObserverList from './src/observer-list';
import History from './src/history';
import ObserverHistory from './src/observer-history';

export {
    Events,
    Observer,
    ObserverList,
    History,
    ObserverHistory
};
