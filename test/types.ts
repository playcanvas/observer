import { Observer } from '../src/observer';

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
