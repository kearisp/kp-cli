import * as OS from "os";
import * as Path from "path";
import {Command} from "./Command";
import {CommandBuilder} from "./CommandBuilder";
import {Logger} from "./Logger";
import {CommandNotFoundError, InvalidError} from "../errors";
import {generateCompletion} from "../utils";
import {CommandInput} from "./CommandInput";


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

    public command(name: string): CommandBuilder {
        let command = this.commands.find((command) => command.definition === name);

        if(!command) {
            command = new Command(name);

            this.commands.push(command);
        }

        return new CommandBuilder(this, command);
    }

    protected async process(parts: string[]): Promise<string> {
        const unprocessed = new Map<Command, CommandInput>();

        for(const command of this.commands) {
            try {
                const input = command.parse(parts);

                if(!input.processed) {
                    unprocessed.set(command, input);
                    continue;
                }

                return command.emit(this.name, input);
            }
            catch(err) {
                if(!(err instanceof InvalidError)) {
                    Logger.error(err.message);
                }
            }
        }

        for(const [command, input] of unprocessed.entries()) {
            if(input.option("help")) {
                return command.emit(this.name, input);
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
            .option("compbash", {
                type: "boolean"
            })
            .option("compgen", {
                type: "boolean"
            })
            .option("compzsh", {
                type: "boolean"
            })
            .help({
                disabled: true,
                description: "Generate completion script"
            })
            .action(async (input): Promise<string> => {
                const index = input.argument("index"),
                      command = input.argument("command"),
                      parts = this.parseCommand(command, parseInt(index)),
                      res = await this.complete(parts);

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
