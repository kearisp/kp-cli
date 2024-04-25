export class CommandInput {
    public constructor(
        protected readonly _arguments: any,
        protected readonly _options: any
    ) {}

    public argument(key: string): null|string {
        if(key in this._arguments) {
            return this._arguments[key];
        }

        return null;
    }

    public arguments(): any {
        return this._arguments;
    }

    public option<T extends null|string|boolean>(key: string, defaultValue: T = null): T {
        if(key in this._options) {
            return this._options[key];
        }

        return defaultValue;
    }

    public options(): any {
        return this._options;
    }
}
