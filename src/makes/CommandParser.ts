import {Parser} from "./Parser";
import {DefinitionMeta} from "../types";


export class CommandParser {
    public static readonly paramRequiredRegexp = /^<([\w_-]+)>(.*)?$/;
    public static readonly paramOptionalRegexp = /^\[([\w_-]+)](.*)?$/;
    public static readonly spreadRequiredRegexp = /^<\.\.\.([0-9\w_-]+)>(.*)?$/;
    public static readonly spreadOptionalRegexp = /^\[\.\.\.([0-9\w_-]+)](.*)$/
    public static readonly optionRegexp = /^-(?:-(\w[\w\d_-]*)|(\w))$/;
    public static readonly optionMultipleRegexp = /^-(\w+)$/;
    protected readonly command: string[];
    protected readonly definition: string;
    protected readonly definitionMeta: DefinitionMeta[];
    protected index: number = 0;

    public constructor(
        definition: string,
        definitionMeta?: DefinitionMeta[]
    ) {
        this.command = definition
            ? definition.split(/\s+/g)
            : [];
        this.definition = definition;
        this.definitionMeta = definitionMeta || CommandParser.parse(definition);
    }

    public get part(): string {
        return this.command[this.index];
    }

    public meta() {
        return this.definitionMeta[this.index];
    }

    public next(): void {
        this.index++;
    }

    public get eol(): boolean {
        return this.command.length <= this.index;
    }

    public parse(argument: string) {
        const meta = this.meta();

        if(meta.spread === true) {
            const [name] = meta.names;

            return {
                [name]: argument
            };
        }

        const {
            regex,
            names
        } = meta;

        const [, ...values] = regex.exec(argument) || [];

        return names.reduce((res: any, name, index) => {
            res[name] = values[index];

            return res;
        }, {});
    }

    public match(arg: string): boolean {
        const meta = this.meta();

        if(meta.spread === true) {
            return true;
        }

        return meta.regex.test(arg);
    }

    public isSpread(): boolean {
        return this.meta().spread;
    }

    public static parse(definition: string): DefinitionMeta[] {
        const commands = definition
            ? definition.split(/\s+/g)
            : [];

        const parser = new Parser([]);

        return commands.map((command): DefinitionMeta => {
            if(CommandParser.spreadRequiredRegexp.test(command)) {
                const [, name] = CommandParser.spreadRequiredRegexp.exec(command);

                return {
                    names: [name],
                    spread: true,
                    required: true
                };
            }
            else if(CommandParser.spreadOptionalRegexp.test(command)) {
                const [, name] = CommandParser.spreadOptionalRegexp.exec(command);

                return {
                    spread: true,
                    names: [name],
                    required: false
                };
            }

            const {
                names,
                regex,
                partRegex
            } = parser.parse(command);

            return {
                spread: false,
                names,
                regex,
                partRegex
            };
        });
    }
}
