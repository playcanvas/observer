/**
 * The Observer module provides a robust implementation of the observer pattern, an essential
 * mechanism for event handling and data binding in complex applications. It allows for creating
 * observable objects that notify registered observers automatically whenever changes occur. This
 * module is instrumental in developing reactive interfaces and facilitating communication between
 * different parts of an application, enhancing modularity and responsiveness.
 *
 * @module Observer
 */

import { EventHandle } from './event-handle';
import { Events } from './events';
import { History } from './history';
import { Observer } from './observer';
import { ObserverHistory } from './observer-history';
import { ObserverList } from './observer-list';

export {
    EventHandle,
    Events,
    History,
    Observer,
    ObserverHistory,
    ObserverList
};
