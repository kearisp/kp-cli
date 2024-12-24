import * as OS from "os";
import * as Path from "path";

import {CommandNotFoundError} from "../errors/CommandNotFoundError";
import {InvalidError} from "../errors/InvalidError";
import {Command} from "./Command";
import {Logger} from "./Logger";
import {generateCompletion} from "../utils";


export class Cli {
    protected name: string;
    protected commands: Command[] = [];

    public completionScript(): string {
        return generateCompletion(this.name);
    }

    protected parseCommand(command: string, index: number): string[] {
        const parts: string[] = [];

        let current = "",
            quotes = "",
            escape = 0;

        for(let i = 0; i < command.length; i++) {
            const char = command.charAt(i);

            if(char === "\\") {
                escape++;
            }
            else if((char === "\"" || char === "'") && !escape && !quotes) {
                quotes = char;
            }
            else if(char === quotes && !escape) {
                if(current) {
                    parts.push(current);
                }

                quotes = "";
                current = "";
            }
            else if((char === " ") && !escape && !quotes) {
                if(current) {
                    parts.push(current);
                }

                current = "";
            }
            else {
                if(char === "=") {
                    index--;
                }

                current += (escape ? "\\".repeat(escape - 1) : "") + char;
                escape = 0;
            }
        }

        if(current) {
            parts.push(current);
        }

        const [, ...args] = parts;

        return args.length < index ? [...args, ""] : args;
    }

    public command(name: string): Command {
        let command = this.commands.find((command) => {
            return command.name === name;
        });

        if(!command) {
            command = new Command(name);

            this.commands.push(command);
        }

        return command;
    }

    protected async process(parts: string[]): Promise<string> {
        for(const command of this.commands) {
            try {
                const input = command.parse(parts);

                return command.emit(this.name, input);
            }
            catch(err) {
                if(!(err instanceof InvalidError)) {
                    Logger.error(err.message);
                }
            }
        }

        throw new CommandNotFoundError();
    }

    protected async complete(parts: string[]): Promise<string[]> {
        let predicts: string[] = [];

        for(const command of this.commands) {
            try {
                const res = await command.complete(parts);

                predicts = [
                    ...predicts,
                    ...res
                ];
            }
            catch(err) {
                //
            }
        }

        return predicts;
    }

    public async run(argv: string[]): Promise<string> {
        const [, scriptPath, ...parts] = argv;

        this.name = Path.basename(scriptPath);

        this.command("complete [index] [command]")
            .help({
                description: "Generate completion script",
                disabled: true
            })
            .option("compbash", {
                type: "boolean"
            })
            .option("compgen", {
                type: "boolean"
            })
            .option("compzsh", {
                type: "boolean"
            })
            .action(async (input): Promise<string> => {
                const index = input.argument("index");
                const command = input.argument("command");

                const parts = this.parseCommand(command, parseInt(index));

                const res = await this.complete(parts);

                return res
                    .map((predict) => {
                        if(/\s/.test(predict)) {
                            return predict.replace(/\s/g, "\\ ");
                        }

                        return predict;
                    })
                    .join(OS.EOL);
            });

        return this.process(parts);
    }
}
