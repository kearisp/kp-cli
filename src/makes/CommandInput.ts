export class CommandInput {
    public constructor(
        protected readonly args: any,
        protected readonly options: any
    ) {}

    public argument(key: string): null|string {
        if(key in this.args) {
            return this.args[key];
        }

        return null;
    }

    public arguments(): any {
        return this.args;
    }

    public option(key: string): null|string {
        if(key in this.options) {
            return this.options[key];
        }

        return null;
    }
}
