
// TODO: Implement hashing if we have time
export class JSONFriendlyMap<K, V> {
    public size: number;

    private pairs: Pair<K, V>[];

    public clear(): void {
        this.pairs.splice(this.pairs.length);
    }

    public delete(key: K): boolean {
        this.pairs.forEach((pair: Pair<K, V>) => {
            if (pair.key === key) {
                this.pairs.splice(this.pairs.indexOf(pair), 1);
                return true;
            }
        });

        return false;
    }

    public forEach(callbackFn: Function, thisarg?: Object): void {
        this.pairs.forEach((pair: Pair<K, V>) => callbackFn(pair, thisarg));
    }

    public get(key: K): V {
        this.pairs.forEach((pair: Pair<K, V>) => {
            if (pair.key === key) {
                return pair.value;
            }
        });

        return undefined;
    }

    public has(key: K): boolean {
        this.pairs.forEach((pair: Pair<K, V>) => {
            if (pair.key === key) {
                return true;
            }
        });

        return false;
    }

    public set(key: K, value: V): JSONFriendlyMap<K, V> {
        this.pairs.push(new Pair<K, V>(key, value));

        return this;
    }
}

class Pair<K, V> {
    public key: K;
    public value: V;

    public constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}