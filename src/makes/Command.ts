import * as OS from "os";
import {Option, ParamValue, OptionValue, DefinitionMeta} from "../types";
import {escapeRegExp} from "../utils";
import {InvalidError, CommandWithoutAction} from "../errors";
import {Parser} from "./Parser";
import {CommandInput} from "./CommandInput";
import {CommandParser} from "./CommandParser";
import {OptionParser} from "./OptionParser";


type HelpParams = false | {
    disabled?: boolean;
    description?: string;
};

type Completion = {
    name: string;
    isOption?: boolean;
    action: (input: CommandInput) => string[] | Promise<string[]>;
};

type Action = (input: CommandInput) => void | string | Promise<void | string>;

export class Command {
    protected _definitionMeta: DefinitionMeta[];
    protected _description: string;
    protected _help: boolean;
    protected _options: Option[] = [];
    protected _completions: Completion[] = [];
    protected _action: Action;

    public constructor(
        public readonly definition: string
    ) {
        this._definitionMeta = CommandParser.parse(this.definition);
        this._help = true;
    }

    public get length(): number {
        return this._definitionMeta.length;
    }

    protected getCommandInput(params: ParamValue[], optionValues: OptionValue[] = []): CommandInput {
        return new CommandInput(params, optionValues);
    }

    public option(name: string, params: Omit<Option, "name">): this {
        const {
            type,
            help = true,
            default: defaultValue,
            ...rest
        } = params || {};

        this._options = [
            ...this._options.filter((option) => {
                return option.name !== name;
            }),
            {
                name,
                help,
                type: type as Option["type"],
                default: type === "boolean"
                    ? typeof defaultValue === "boolean" ? defaultValue : true
                    : defaultValue,
                ...rest
            }
        ];

        return this;
    }

    protected getOptionSettings(name?: string, alias?: string): Option {
        return this._options.find((option) => {
            return (name && option.name === name) || (alias && option.alias === alias);
        });
    }

    public setDescription(description: string): this {
        this._description = description;

        return this;
    }

    public help(params: HelpParams): this {
        const {
            disabled = false,
            description = ""
        } = typeof params === "boolean" ? {
            disabled: params,
        } : params;

        this._help = !disabled;
        this._description = description;

        if(this._help) {
            this.option("help", {
                type: "boolean",
                alias: "h",
                help: false,
                description: "Help"
            });
        }

        return this;
    }

    public completion(name: Completion["name"], handle: Completion["action"]): this {
        this._completions.push({
            name,
            action: handle
        });

        return this;
    }

    public action(action: Action): this {
        this._action = action;

        return this;
    }

    public parse(parts: string[]): CommandInput {
        const input = [...parts],
              parser = new CommandParser(this.definition, this._definitionMeta),
              argumentValues: ParamValue[] = [],
              optionValues: OptionValue[] = [];

        const applyOption = (option: Option, value?: string): void => {
            switch(option.type) {
                case "boolean":
                    optionValues.push({
                        name: option.name,
                        value: typeof value === "undefined"
                            ? (option.default ?? true)
                            : value === "1" || value.toLowerCase() === "true"
                    });
                    break;

                case "number":
                    optionValues.push({
                        name: option.name,
                        value: typeof value === "undefined"
                            ? (option.default ?? 0)
                            : parseFloat(value)
                    });
                    break;

                case "string":
                    optionValues.push({
                        name: option.name,
                        value: typeof value === "undefined"
                            ? (option.default ?? "")
                            : value
                    });
                    break;
            }
        };

        let spread = false;

        while(input.length > 0) {
            let part = input.shift(),
                nextPart = input[0] || "";

            if(!spread && OptionParser.isSingleWithoutValue(part)) {
                const {
                    name,
                    alias
                } = OptionParser.parse(part);

                const option = this.getOptionSettings(name, alias);

                if(option) {
                    switch(option.type) {
                        case "boolean": {
                            applyOption(option, undefined);
                            break;
                        }

                        case "number":
                        case "string":
                            applyOption(option, !nextPart.startsWith("-") ? input.shift() : undefined);
                            break;
                    }
                }
            }
            else if(!spread && OptionParser.isSingleWithValue(part)) {
                const {
                    name,
                    alias,
                    value
                } = OptionParser.parseWithValue(part);

                const option = this.getOptionSettings(name, alias);

                if(option) {
                    applyOption(option, value);
                }
            }
            else if(!spread && OptionParser.isMultiple(part)) {
                const {alias} = OptionParser.parse(part);

                alias.split("").forEach((alias: string) => {
                    const option = this.getOptionSettings(undefined, alias);

                    if(option) {
                        applyOption(option, undefined);
                    }
                });
            }
            else if(!parser.eol && parser.match(part)) {
                const res = parser.parse(part);

                for(const name in res) {
                    argumentValues.push({
                        name,
                        value: res[name]
                    });
                }

                if(!parser.isSpread()) {
                    parser.next();
                }
                else {
                    spread = true;
                }
            }
            else {
                throw new InvalidError("Invalid command");
            }
        }

        while(!parser.eol) {
            if(!parser.match("")) {
                break;
            }

            parser.next();
        }

        return new CommandInput(argumentValues, optionValues, parser.eol);
    }

    public async emit(name: string, input: CommandInput): Promise<string> {
        if(this._help && input.option("help")) {
            const options = this._options.filter((option) => {
                return option.help;
            });

            return [
                "",
                `Usage: ${name} ${this.definition}`,
                "",
                ...this._description ? [
                    this._description,
                    ""
                ] : [],
                ...options.length > 0 ? [
                    "Options:",
                    ...options.map((option) => {
                        const alias = option.alias ? `-${option.alias},` : "   ";

                        return `  ${alias} --${option.name}\t\t${option.description}`;
                    }),
                    ""
                ] : []
            ].join(OS.EOL);
        }

        if(!this._action) {
            throw new CommandWithoutAction();
        }

        const res = await this._action(input);

        if(typeof res === "undefined") {
            return "";
        }

        return res;
    }

    public async complete(parts: string[]): Promise<string[]> {
        if(!this._help) {
            return [];
        }

        const commands = this.definition
            ? this.definition.split(/\s+/g)
            : [];
        const parser = new Parser(parts),
              options: any = {},
              paramValues: ParamValue[] = [],
              optionValues: OptionValue[] = [];

        for(const command of commands) {
            if(parser.isSpread(command)) {
                const name = parser.parseSpreadCommand(command);

                while(!parser.eol) {
                    if(parser.part) {
                        paramValues.push({
                            name,
                            value: parser.part
                        });
                    }

                    parser.next();
                }

                return this.predictCommand(command, parser.part, this.getCommandInput(paramValues, optionValues));
            }
            else if(!parser.isLast && parser.isCommand(command)) {
                const partArguments = parser.getArguments(command);

                for(const name in partArguments) {
                    paramValues.push({
                        name,
                        value: partArguments[name],
                    })
                }

                parser.next();
            }
            else if(parser.isLast && parser.isCommand(command, true)) {
                const partArguments = parser.getArguments(command);

                for(const name in partArguments) {
                    paramValues.push({
                        name,
                        value: partArguments[name],
                    });
                }

                return this.predictCommand(command, parser.part, this.getCommandInput(paramValues, optionValues));
            }
            else {
                throw new InvalidError("Error");
            }

            while(parser.isOption(true)) {
                const {
                    dash,
                    name,
                    sign,
                    value
                } = parser.parseOptionV2();

                const option = name ? this._options.find((option) => {
                    if(dash === "-" && name.length === 1) {
                        return option.alias === name;
                    }

                    return option.name === name;
                }) : undefined;

                if(!option && !sign && parser.isLast) {
                    return this._options.reduce((res: string[], option) => {
                        if(dash === "-" && option.alias && (!name || name === option.alias)) {
                            res.push(`-${option.alias}`);
                        }

                        if(!name || option.name.startsWith(name)) {
                            res.push(`--${option.name}`);
                        }

                        return res;
                    }, []);
                }

                if(option) {
                    switch(option.type) {
                        case "boolean":
                            options[option.name] = true;
                            optionValues.push({
                                name: option.name,
                                value: true
                            });
                            break;

                        case "string":
                        case "number":
                            let v: any = value;

                            if(!parser.isLast && sign !== "=") {
                                parser.next();

                                v = parser.part;
                            }

                            if(option.type === "number") {
                                v = parseFloat(v);
                            }

                            if(parser.isLast) {
                                const completion = this._completions.find((completion) => {
                                    return completion.name === option.name;
                                });

                                if(!completion) {
                                    return [];
                                }

                                const predicts = await completion.action(this.getCommandInput(paramValues, optionValues));

                                return predicts.map((predict): string => {
                                    if(sign === "=") {
                                        return `${dash}${name}${sign}${predict}`;
                                    }

                                    return predict;
                                });
                            }

                            options[option.name] = v;
                            optionValues.push({
                                name: option.name,
                                value: v
                            });
                            break;
                    }
                }

                parser.next();
            }
        }

        return [];
    }

    protected async predictCommand(command: string, part: string, input: CommandInput): Promise<string[]> {
        const comOther = /^([^\[\]<>{}]+)(.*)$/;

        let exitCount = 0,
            reg = "",
            restCommand = command,
            isAction = false,
            predict = "",
            resPredicts = [""];

        while(restCommand) {
            let stepReg: string;

            if(Parser.paramRequiredRegexp.test(restCommand)) {
                const [, name, rest] = Parser.paramRequiredRegexp.exec(restCommand);

                isAction = true;
                predict = name;
                restCommand = rest;
                stepReg = "(.+?)";
            }
            else if(Parser.paramOptionalRegexp.test(restCommand)) {
                const [, name, rest] = Parser.paramOptionalRegexp.exec(restCommand);

                isAction = true;
                predict = name;
                restCommand = rest;
                stepReg = "(.+?)?";
            }
            else if(Parser.spreadRequiredRegexp.test(restCommand)) {
                const [, match, rest] = Parser.spreadRequiredRegexp.exec(restCommand) || [];

                isAction = true;
                predict = match;
                restCommand = rest;
                stepReg = "(.+?)";
            }
            else if(Parser.spreadOptionalRegexp.test(restCommand)) {
                const [, match, rest] = Parser.spreadOptionalRegexp.exec(restCommand) || [];

                isAction = true;
                predict = match;
                restCommand = rest;
                stepReg = "(.+?)?";
            }
            else if(comOther.test(restCommand)) {
                const [, match, rest = ""] = comOther.exec(restCommand) || [];

                isAction = false;
                predict = match;
                restCommand = rest;
                stepReg = `${escapeRegExp(match)}`;
            }

            if(++exitCount > 50) {
                throw new Error(`Emergency exit. Rest command: "${restCommand}"`);
            }

            if(stepReg) {
                if(isAction) {
                    const completion = this._completions.find((completion) => {
                        return completion.name === predict;
                    });

                    if(completion) {
                        let predicts: string[] = (await completion.action(input));

                        const value = input.arguments(predict);

                        if(Array.isArray(value)) {
                            predicts = predicts.filter((p) => {
                                return !value.includes(p);
                            });
                        }

                        resPredicts = predicts.reduce((res: string[], predict: string) => {
                            return [
                                ...res,
                                ...resPredicts.map((resPredict) => {
                                    return resPredict + predict;
                                })
                            ];
                        }, []);
                    }
                }
                else {
                    resPredicts = resPredicts.map((rp) => {
                        return rp + predict;
                    });
                }

                const nextReg = `${reg}${stepReg}`;

                if(!new RegExp(nextReg).test(part)) {
                    break;
                }

                reg = nextReg;
            }
        }

        return resPredicts;
    }

    protected async predictOption(part: string, input: CommandInput): Promise<string[]> {
        const [, dash, name, sign, value] = /^(--?)(\w+)?(=)?(.+)?/.exec(part) || [];

        const option = this._options.find((option) => {
            if(!name) {
                return false;
            }

            return option.name === name || option.alias === name;
        });

        if(!option) {
            return this._options.reduce((res: string[], option) => {
                if(dash === "-") {
                    res.push(
                        `-${option.alias}`,
                        `--${option.name}`
                    );
                }
                else if(dash === "--") {
                    res.push(
                        `--${option.name}`
                    );
                }

                return res;
            }, []);
        }

        const completion = this._completions.find((completion) => {
            return completion.name === option.name;
        });

        if(!completion) {
            return [];
        }

        const predicts = await completion.action(input);

        return predicts.map((predict) => {
            return ``;
        });
    }
}
