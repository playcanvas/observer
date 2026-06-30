import { History } from '../src/history';
import { Observer } from '../src/observer';
import { ObserverHistory } from '../src/observer-history';
import { ObserverList } from '../src/observer-list';

type Data = {
    name: string;
    age: number;
    nested: {
        city: string;
    };
};

const observer = new Observer<Data>({
    name: 'Will',
    age: 46,
    nested: {
        city: 'London'
    }
});

const name: string = observer.get('name');
const age: number = observer.get('age');
const nested: { city: string } = observer.get('nested');
const json: Data = observer.json();

observer.set('name', 'Ada');
observer.set('age', 47);
observer.set('nested.city', 'Paris');
observer.patch({ name: 'Grace' });

// @ts-expect-error wrong top-level value type
observer.set('age', '47');

// @ts-expect-error wrong patch value type
observer.patch({ age: '47' });

void [name, age, nested, json];

type Item = {
    id: string;
    name: string;
    rank: number;
};

const list = new ObserverList<Item>({
    index: 'id',
    sorted: (a, b) => a.rank - b.rank
});

const item: Item = {
    id: 'a',
    name: 'First',
    rank: 1
};

const pos: number | null = list.add(item);
const found: Item | null = list.get(0);
const items: Item[] = list.array();
const names: string[] = list.map((value) => value.name);

list.set(0, item);

// @ts-expect-error wrong list item shape
list.add({ id: 'b', rank: 2 });

// @ts-expect-error wrong list set value shape
list.set(0, { id: 'c', rank: 3 });

const observerHistory = new ObserverHistory<Data>({
    item: observer,
    history: new History()
});

const historyItem: Observer<Data> = observerHistory.item;

new ObserverHistory<Data>({
    // @ts-expect-error wrong observer history item shape
    item: new Observer<{ other: string }>({ other: 'x' }),
    history: new History()
});

void [pos, found, items, names, historyItem];
