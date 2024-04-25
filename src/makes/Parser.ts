import {escapeRegExp} from "../utils";


const comAttrReq = /^<([\w_-]+)>(.*)?$/;
const comAttrOpt = /^\[([\w_-]+)](.*)?$/;
const comOther = /^([^[\]<>{}])(.*)$/;
const regOption = /^-(?:-(\w[\w\d_-]*)|(\w))$/;
const regOptionWithValue = /^-(?:-(\w[\w\d_-]*)|(\w))=(.*)$/;
const regShortMultipleOption = /^-(\w+)$/;

export class Parser {
    public static readonly attrRequiredRegexp = /^<([\w_-]+)>(.*)?$/;
    public static readonly attrOptionalRegexp = /^\[([\w_-]+)](.*)?$/;
    public static readonly optionRegexp = /^-(?:-(\w[\w\d_-]*)|(\w))$/;
    public static readonly optionMultipleRegexp = /^-(\w+)$/;
    public static readonly spreadRequiredRegexp = /^<\.\.\.([0-9\w_-]+)>(.*)?$/;
    public static readonly spreadOptionalRegexp = /^\[\.\.\.([0-9\w_-]+)](.*)$/
    protected index: number = 0;

    public constructor(
        public readonly parts: string[]
    ) {}

    public get part(): string {
        return this.parts[this.index];
    }

    public get isLast(): boolean {
        return this.parts.length - 1 === this.index;
    }

    public get eol() {
        return this.parts.length <= this.index;
    }

    public next(): void {
        this.index++;
    }

    public isSpread(command: string) {
        if(this.eol) {
            return false;
        }

        return Parser.spreadOptionalRegexp.test(command) ||
            Parser.spreadRequiredRegexp.test(command);
    }

    public isCommand(command: string, partial: boolean = false): boolean {
        if(this.eol || this.isOption()) {
            return false;
        }

        const {
            regex,
            partRegex
        } = this.parse(command);

        if(partial) {
            return partRegex.test(this.part);
        }

        return regex.test(this.part);
    }

    public isOption(partial: boolean = false): boolean {
        if(this.eol) {
            return false;
        }

        if(partial && /^--?$/.test(this.part)) {
            return true;
        }

        return regOption.test(this.part) ||
            regOptionWithValue.test(this.part) ||
            regShortMultipleOption.test(this.part);
    }

    public isRegOption() {
        if(this.eol) {
            return false;
        }

        return regOption.test(this.part);
    }

    public isOptionWithValue(): boolean {
        return !this.eol && regOptionWithValue.test(this.part);
    }

    public isMultipleOptions(): boolean {
        return Parser.optionMultipleRegexp.test(this.part);
    }

    public parseOption() {
        const [, name, alias] = regOption.exec(this.part) || [];

        return {name, alias};
    }

    public parseOptionWithValue() {
        const [, name, alias, value] = regOptionWithValue.exec(this.part) || [];

        return {name, alias, value};
    }

    public parseOptionMultiple() {
        const [, options= ""] = Parser.optionMultipleRegexp.exec(this.part) || [];

        return options.split("");
    }

    public getArguments(command: string) {
        const {
            names,
            regex
        } = this.parse(command);

        const [, ...values] = regex.exec(this.part) || [];

        return names.reduce((res: any, name, index) => {
            res[name] = values[index];

            return res;
        }, {});
    }

    public parseSpreadCommand(command: string) {
        const [, name] = Parser.spreadRequiredRegexp.exec(command) || Parser.spreadOptionalRegexp.exec(command) || [];

        return name;
    }

    public complete(command: string) {
        const {
            partRegex
        } = this.parse(command);

        return partRegex.exec(this.part);
    }

    protected parse(part: string) {
        let restCommand = part,
            names: string[] = [],
            resReg = "",
            partReg = "",
            exitCount = 0;

        while(restCommand) {
            let stepReg;

            if(comAttrReq.test(restCommand)) {
                const [, name, rest] = comAttrReq.exec(restCommand);

                // console.warn(name, rest);
                names.push(name);
                stepReg = "(.+?)";
                restCommand = rest;
            }
            else if(comAttrOpt.test(restCommand)) {
                const [, name, rest] = comAttrOpt.exec(restCommand);

                // console.warn(name, rest);
                names.push(name);
                stepReg = "(.+?)?";
                restCommand = rest;
            }
            else if(comOther.test(restCommand)) {
                const [, match, rest] = comOther.exec(restCommand);

                stepReg = `${escapeRegExp(match)}`;
                restCommand = rest;
            }

            if(stepReg) {
                resReg += stepReg;
                partReg = `${resReg}|${partReg}`;
            }

            if(exitCount++ > 100) {
                throw new Error("Emergency exit")
            }
        }

        return {
            names,
            regex: new RegExp(`^${resReg}$`, "s"),
            partRegex: new RegExp(`^(?:${partReg})$`)
        };
    }
}
