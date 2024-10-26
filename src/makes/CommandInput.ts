import {
    Param,
    Option,
    OptionValue
} from "../types";


export class CommandInput {
    public constructor(
        protected readonly _arguments: any,
        protected readonly _options: OptionValue[]
    ) {}

    public argument(key: string): string|undefined {
        if(key in this._arguments) {
            return this._arguments[key];
        }

        return undefined;
    }

    public arguments(): any {
        return this._arguments;
    }

    public option(key: string, defaultValue?: any): any {
        const optionValue = this._options.find((option) => {
            return option.name === key;
        });

        if(!optionValue) {
            return defaultValue;
        }

        return optionValue.value;
    }

    public options(key?: string): any[] {
        return this._options.filter((option) => {
            return option.name === key;
        }).map((option) => {
            return option.value;
        });
    }
}
