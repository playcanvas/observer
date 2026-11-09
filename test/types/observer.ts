// Type-level tests against the published declarations (types/index.d.ts). Compiled with
// `npm run test:types`; nothing here runs.
import { History, Observer, ObserverHistory, ObserverList } from '@playcanvas/observer';

// Observers created from object literals stay assignable to the untyped Observer.
const settings = new Observer({ engineVersion: '2.0', count: 1 });
export const plain: Observer = settings;
export const takesObservers = (items: Observer[]) => items.length;
takesObservers([settings, new Observer()]);

// The same holds for histories and lists built around them.
export const observerHistory: ObserverHistory = new ObserverHistory({ item: settings, history: new History() });
settings.history = observerHistory;
const list = new ObserverList<Observer>({ index: 'id' });
list.add(new Observer({ id: 1 }));

// Untyped observers accept any path and value.
const untyped = new Observer();
untyped.set('a.b.c', 1);
export const anything: number = untyped.get('a.b.c');

// Typed observers check top-level keys.
type Settings = { engineVersion: string, count: number };
const typed = new Observer<Settings>({ engineVersion: '2.0' });
export const version: string = typed.get('engineVersion');
typed.set('count', 2);
// @ts-expect-error count is a number
typed.set('count', 'two');
export const snapshot: Settings = typed.json();
typed.patch({ count: 3 });

// Nested paths are not checked.
typed.set('nested.path', { any: 'thing' });
