import {Logger, Option} from "../types";
import {
    escapeRegExp,
    generateCommandRegExp,
    isCommand,
    isSpread
} from "../utils";


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
    action: (options: any, ...args: (string | string[])[]) => string[] | Promise<string[]>;
};

type Action = (options: any, ...args: (string | string[])[]) => void | string | Promise<void | string>;

const regOption = /^-(?:-(\w[\w\d_-]*)|(\w))$/;
const regOptionWithValue = /^-(?:-(\w[\w\d_-]*)|(\w))=(.*)$/;
const regShortMultipleOption = /^-(\w+)$/;


class Command {
    protected _command: string;
    protected _help: boolean;
    protected _description: string;
    protected _commands: Command[] = [];
    protected _options: Option[] = [];
    protected _action: Action;
    protected _completions: Completion[] = [];
    protected _logger?: Logger;

    public constructor(command: string, logger?: Logger) {
        this._command = command;
        this._logger = logger;
    }

    public getName() {
        return this._command;
    }

    public command(name: string): Command {
        let command = this._commands.find((command) => {
            return command.getName() === name;
        });

        if(!command) {
            command = new Command(name, this._logger);

            this._commands.push(command);
        }

        return command;
    }

    public option(name: string, params: OptionParams) {
        const {
            type = "boolean",
            default: defaultValue,
            ...rest
        } = params || {};

        this._options.push({
            name,
            type: type as Option["type"],
            default: type === "boolean"
                ? typeof defaultValue === "boolean" ? defaultValue : false
                : defaultValue,
            ...rest
        });

        return this;
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
                description: "Help"
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
    }

    public parse(parts: string[], partial = false) {
        const commands = this._command
            ? this._command.split(/\s+/g)
            : [];

        const args: (string | string[])[] = [];
        const options: {
            [name: string]: string | boolean | number;
        } = {};

        let current = 0;

        for(const command of commands) {
            let part = parts[current] || "";
            let isLast = current === parts.length - 1;

            if(isSpread(command)) {
                let value: string[] = [];

                while(current < parts.length) {
                    isLast = current === parts.length - 1;

                    if(partial && isLast) {
                        args.push(value);

                        return {
                            args,
                            options,
                            command,
                            part: parts[current]
                        };
                    }

                    value.push(parts[current]);

                    current++;
                }

                args.push(value);
            }
            else if(isCommand(command)) {
                const regExp = generateCommandRegExp(command);

                if(!regExp) {
                    throw new Error(`Something wrong: ${command}`);
                }

                if(partial && isLast) {
                    const partExp = generateCommandRegExp(command, true)

                    // this.warning(">", partExp.toString(), part, partExp.exec(part));

                    if(partExp.test(part)) {
                        return {
                            args,
                            options,
                            command,
                            part
                        };
                    }
                }

                if(!regExp.test(part)) {
                    return null;
                }

                const [, ...match] = regExp.exec(part) || [];

                args.push(...match);

                current++;
            }

            let isOption = true;

            do {
                part = parts[current] || "";

                if(regOption.test(part)) {
                    const [, name, alias] = regOption.exec(part) || [];

                    const option = this._options.find((option) => {
                        return (name && option.name === name) || (alias && option.alias === alias);
                    });

                    if(!option) {
                        throw new Error(`Option "${name || alias}" is not defined (1)`);
                    }

                    switch(option.type) {
                        case "boolean":
                            options[option.name] = true;
                            break;

                        case "number":
                            options[option.name] = parseFloat(parts[++current]);
                            break;

                        case "string":
                            options[option.name] = parts[++current];
                            break;
                    }

                    current++;
                }
                else if(regOptionWithValue.test(part)) {
                    const [, name, alias, value] = regOptionWithValue.exec(part) || [];

                    const option = this._options.find((option) => {
                        if(name) {
                            return option.name === name;
                        }

                        if(alias) {
                            return option.alias === alias;
                        }

                        return false;
                    });

                    if(!option) {
                        throw new Error(`Option not found ${name || alias} (2)`);
                    }

                    switch(option.type) {
                        case "boolean":
                            options[option.name] = ["true", "1"].includes(value);
                            break;

                        case "string":
                            options[option.name] = value;
                            break;

                        case "number":
                            options[option.name] = parseFloat(value);
                            break;
                    }

                    current++;
                }
                else if(regShortMultipleOption.test(part)) {
                    const [, alias] = regShortMultipleOption.exec(part) || [];

                    this._options.filter((option) => {
                        if(!option.alias) {
                            return false;
                        }

                        return alias.split("").includes(option.alias);
                    }).forEach((option) => {
                        if(option.type === "boolean") {
                            options[option.name] = true;
                        }
                    });

                    current++;
                    isOption = true;
                }
                else {
                    isOption = false;
                }
            }
            while(isOption);
        }

        return {
            args,
            options,
            parts: parts.slice(current)
        };
    }

    public async process(parts: string[], parentOptions: any = {}, parentArgs: (string | string[])[] = []) {
        const res = this.parse(parts);

        if(!res) {
            return null;
        }

        const {
            args,
            parts: childParts
        } = res;

        const options = {
            ...parentOptions,
            ...res.options
        };

        if(this._action) {
            if(this._help && options.help) {
                const optionsDescription = this._options.map((option) => {
                    const {
                        alias,
                        name,
                        description = ""
                    } = option;

                    const aliasDescription = alias ? `, -${alias}` : "";

                    return ` --${name}${aliasDescription} - ${description}`;
                }).join("\n");

                return `Help:\n ${this._description || ""}\n\n${optionsDescription}\n`;
            }

            return (await this._action(options, ...parentArgs, ...args)) || "";
        }

        for(const command of this._commands) {
            const res = await command.process(childParts, options, [
                ...parentArgs,
                ...args
            ]);

            if(res !== null) {
                return res;
            }
        }

        return null;
    }

    public async predictCommand(command: string, part: string, options: any = {}, args: (string | string[])[] = []) {
        const comAttrReq = /^<([\w_-]+)>(.*)?$/;
        const comAttrOpt = /^\[([\w_-]+)](.*)?$/;
        const comSpread = /^\[\.\.\.([0-9\w_-]+)](.*)?$/;
        const comSpreadReq = /^<\.\.\.([0-9\w_-]+)>(.*)?$/;
        const comOther = /^([^\[\]<>{}]+)(.*)$/;

        let exitCount = 0;
        let reg = "";
        let restCommand = command;
        let isAction = false;
        let predict = "";
        let resPredicts = [""];

        while(restCommand) {
            let stepReg: string;

            if(comAttrReq.test(restCommand)) {
                const [, name, rest] = comAttrReq.exec(restCommand);

                isAction = true;
                predict = name;
                restCommand = rest;
                stepReg = "(.+?)";
            }
            else if(comAttrOpt.test(restCommand)) {
                const [, name, rest] = comAttrOpt.exec(restCommand);

                isAction = true;
                predict = name;
                restCommand = rest;
                stepReg = "(.+?)?";
            }
            else if(comSpread.test(restCommand)) {
                const [, match, rest] = comSpread.exec(restCommand) || [];

                isAction = true;
                predict = match;
                restCommand = rest;
                stepReg = "(.+?)?";
            }
            else if(comSpreadReq.test(restCommand)) {
                const [, match, rest] = comSpreadReq.exec(restCommand) || [];

                isAction = true;
                predict = match;
                restCommand = rest;
                stepReg = "(.+?)";
            }
            else if(comOther.test(restCommand)) {
                const [, match, rest] = comOther.exec(restCommand) || [];

                isAction = false;
                predict = match;
                restCommand = rest;
                stepReg = `${escapeRegExp(match)}`;
            }

            exitCount++;

            if(exitCount > 100) {
                this.warn("Emergency exit", {
                    restCommand
                });

                return null;
            }

            if(stepReg) {
                if(isAction) {
                    const completion = this._completions.find((completion) => {
                        return completion.name === predict;
                    });

                    if(completion) {
                        const predicts: string[] = await completion.action(options, ...args);

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

    public async complete(parts: string[]) {
        const res = this.parse(parts, true);

        if(!res) {
            return null;
        }

        const {
            args,
            options,
            parts: childParts,
            part,
            command
        } = res;

        if(command && typeof part !== "undefined") {
            return this.predictCommand(command, part, options, args);
        }

        const predicts: string[] = [];

        for(const command of this._commands) {
            const res = await command.complete(childParts);

            if(res) {
                predicts.push(...res);
            }
        }

        return predicts;
    }

    protected log(...args: any[]) {
        if(!this._logger) {
            return;
        }

        this._logger.log(...args);
    }

    protected info(...args: any[]) {
        if(!this._logger) {
            return;
        }

        this._logger.info(...args);
    }

    protected warn(...args: any[]) {
        if(!this._logger) {
            return;
        }

        this._logger.warn(...args);
    }

    protected error(...args: any[]) {
        if(!this._logger) {
            return;
        }

        this._logger.error(...args);
    }
}


export {Command};
