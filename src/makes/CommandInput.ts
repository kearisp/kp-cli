import {
    Param,
    ParamValue,
    Option,
    OptionValue
} from "../types";


export class CommandInput {
    public constructor(
        protected readonly _arguments: ParamValue[],
        protected readonly _options: OptionValue[],
        public readonly processed: boolean = true,
    ) {}

    public argument(name: string): undefined | string {
        const paramValue = this._arguments.find((param) => param.name === name);

        if(!paramValue) {
            return undefined;
        }

        return paramValue.value;
    }

    public arguments(name: string): string[] {
        return this._arguments.filter((param) => {
            return param.name === name;
        }).map((param) => {
            return param.value;
        });
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

    public options(name: string): any[] {
        return this._options.filter((option) => {
            return option.name === name;
        }).map((option) => {
            return option.value;
        });
    }
}
