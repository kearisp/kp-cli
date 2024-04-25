import * as OS from "os";

import {Option, Param} from "../types";
import {escapeRegExp} from "../utils";
import {InvalidError} from "../errors/InvalidError";
import {Parser} from "./Parser";
import {Logger} from "./Logger";
import {CommandInput} from "./CommandInput";


type HelpParams = false | {
    disabled?: boolean;
    description?: string;
};

type OptionParams = Omit<Option, "name" | "type"> & {
    type?: Option["type"];
};

type Completion = {
    name: string;
    isOption?: boolean;
    action: (input: CommandInput) => string[] | Promise<string[]>;
};

type Action = (input: CommandInput) => void | string | Promise<void | string>;


export class Command {
    protected _command: string;
    protected _help: boolean;
    protected _description: string;
    protected _options: Option[] = [];
    protected _action: Action;
    protected _completions: Completion[] = [];

    public constructor(command: string) {
        this._command = command;
        this._help = true;
    }

    public get name(): string {
        return this._command;
    }

    protected getCommandInput(args: any, options: any): CommandInput {
        const _this = this;

        return new class extends CommandInput {
            protected getParamSettings(): Param[] {
                return [];
            }

            protected getOptionSettings(): Option[] {
                return _this._options;
            }
        }(args, options);
    }

    public option(name: string, params: OptionParams) {
        const {
            type = "boolean",
            default: defaultValue,
            help = true,
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
                    ? typeof defaultValue === "boolean" ? defaultValue : false
                    : defaultValue,
                ...rest
            }
        ];

        return this;
    }

    protected getOptionSettings(name?: string, alias?: string) {
        return this._options.find((option) => {
            return (name && option.name === name) || (alias && option.alias === alias);
        });
    }

    public help(params: HelpParams) {
        const {
            disabled= false,
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
                description: "Help",
                help: false
            });
        }

        return this;
    }

    public completion(name: Completion["name"], handle: Completion["action"]) {
        this._completions.push({
            name,
            action: handle
        });

        return this;
    }

    public action(action: Action) {
        this._action = action;

        return this;
    }

    public parse(parts: string[]): CommandInput {
        const commands = this._command
            ? this._command.split(/\s+/g)
            : [];

        const args: {
            [name: string]: string | boolean | number | string[];
        } = {};
        const options: {
            [name: string]: string | boolean | number;
        } = {};

        const parser = new Parser(parts);

        for(const command of commands) {
            if(parser.isSpread(command)) {
                const name = parser.parseSpreadCommand(command);

                const values: string[] = [];

                while(!parser.eol) {
                    values.push(parser.part);

                    parser.next();
                }

                args[name] = values;

                parser.next();
            }
            else if(parser.isCommand(command)) {
                const res = parser.getArguments(command);

                for(const name in res) {
                    args[name] = res[name];
                }

                parser.next();
            }
            else {
                throw new InvalidError("Invalid command");
            }

            while(parser.isOption()) {
                if(parser.isRegOption()) {
                    const {name, alias} = parser.parseOption();

                    const option = this.getOptionSettings(name, alias);

                    if(option) {
                        switch(option.type) {
                            case "boolean":
                                options[option.name] = true;
                                break;

                            case "number":
                                parser.next();
                                options[option.name] = parseFloat(parser.part);
                                break;

                            case "string":
                                parser.next();
                                options[option.name] = parser.part;
                                break;
                        }
                    }
                }
                else if(parser.isOptionWithValue()) {
                    const {name, alias, value} = parser.parseOptionWithValue();

                    const option = this.getOptionSettings(name, alias);

                    if(option) {
                        switch(option.type) {
                            case "boolean":
                                options[option.name] = true;
                                break;

                            case "number":
                                options[option.name] = parseFloat(value);
                                break;

                            case "string":
                                options[option.name] = value;
                                break;
                        }
                    }
                }
                else if(parser.isMultipleOptions()) {
                    parser.parseOptionMultiple().forEach((alias: string) => {
                        const option = this.getOptionSettings(undefined, alias);

                        if(option && option.type === "boolean") {
                            options[option.name] = true;
                        }
                    });
                }

                parser.next();
            }
        }

        if(!parser.eol) {
            throw new InvalidError("Haven't ended");
        }

        // return new CommandInput(args, options);
        return this.getCommandInput(args, options);
    }

    public async emit(name: string, input: CommandInput): Promise<string> {
        if(this._help && input.option("help")) {
            const options = this._options.filter((option) => {
                return option.help;
            });

            return [
                "",
                `Usage: ${name} ${this.name}`,
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
            throw new Error("Command without action");
        }

        const res = await this._action(input);

        if(typeof res === "undefined") {
            return "";
        }

        return res;
    }

    protected async predictCommand(command: string, part: string, input: CommandInput) {
        const comOther = /^([^\[\]<>{}]+)(.*)$/;

        let exitCount = 0;
        let reg = "";
        let restCommand = command;
        let isAction = false;
        let predict = "";
        let resPredicts = [""];

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
                        let predicts: string[] = await completion.action(input);

                        const value = input.argument(predict) as string|string[];

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

    protected async predictOption(part: string) {
        const [, dash, name] = /^(--?)(\w+)?/.exec(part) || [];

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

    public async complete(parts: string[]): Promise<string[]> {
        if(!this._help) {
            return [];
        }

        const commands = this._command
            ? this._command.split(/\s+/g)
            : [];
        const parser = new Parser(parts);

        const args: any = {};
        const options: any = {};

        for(const command of commands) {
            if(parser.isSpread(command)) {
                const name = parser.parseSpreadCommand(command);
                const value = [];

                while(!parser.eol) {
                    if(parser.part) {
                        value.push(parser.part);
                    }

                    parser.next();
                }

                args[name] = value;

                Logger.info(args);
                return this.predictCommand(command, parser.part, this.getCommandInput(args, options));
            }
            else if(!parser.isLast && parser.isCommand(command)) {
                const partArguments = parser.getArguments(command);

                for(const name in partArguments) {
                    args[name] = partArguments[name];
                }

                parser.next();
            }
            else if(parser.isLast && parser.isCommand(command, true)) {
                return this.predictCommand(command, parser.part, this.getCommandInput(args, options));
            }
            else {
                throw new InvalidError("Error");
            }

            while(parser.isOption(true)) {
                if(parser.isLast && parser.isCommand(command)) {
                    return this.predictOption(parser.part);
                }

                parser.next();
            }
        }

        return [];
    }
}
