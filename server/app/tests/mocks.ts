export namespace MongooseMock {
    export class Query {
        private data: Object;
        private isResolved: boolean;

        public constructor(data: Object, isResolved: boolean) {
            this.data = data;
            this.isResolved = isResolved;
        }

        public async select(): Promise<Object> {
            return (this.isResolved) ? Promise.resolve(this.data) : Promise.reject(this.data);
        }
    }

    export class NullQuery {
        private isResolved: boolean;

        public constructor(isResolved: boolean) {
            this.isResolved = isResolved;
        }

        public async select(): Promise<undefined> {
            return (this.isResolved) ? undefined : Promise.reject(undefined);
        }
    }

    // These are mocks so it's okay to have many in one file
    // tslint:disable-next-line:max-classes-per-file
    export class Schema {
        private data: Object;
        private isNotAnArray: boolean;
        public constructor(data: Object, isNotAnArray: boolean) {
            this.data = data;
            this.isNotAnArray = isNotAnArray;
        }

        public get(id: string): Object {
            return this.isNotAnArray ? this.data : this.data[id];
        }

    }
}
