import * as OS from "os";

import {Command} from "./Command";
import {Logger} from "../types";

import {generateCompletion} from "../utils";


class Cli extends Command {
    protected scriptPath: string;

    public constructor(logger?: Logger) {
        super("", logger);
    }

    public completionScript() {
        return generateCompletion(this._command);
    }

    protected parseCommand(command: string): string[] {
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
            else if(char === " " && !escape && !quotes) {
                if(current) {
                    parts.push(current);
                }

                current = "";
            }
            else {
                current += (escape ? "\\".repeat(escape - 1) : "") + char;
                escape = 0;
            }
        }

        if(current) {
            parts.push(current);
        }

        return parts;
    }

    public async run(argv: string[]) {
        const [, scriptPath, ...rest] = argv;

        this.scriptPath = scriptPath

        const [, name] = /^.+\/(.+)$/.exec(scriptPath) || [];

        const parts = [name, ...rest];
        this._command = name;

        if(parts.indexOf("--completion") > -1 || parts.indexOf("--compbash") > -1 || parts.indexOf("--compgen") > -1) {
            const completion = new Command(`${name} <index> <prev> <command>`, this._logger);

            const promise = new Promise<[string, string]>((resolve) => {
                completion
                    .option("completion", {
                        type: "boolean"
                    })
                    .option("compbash", {
                        type: "boolean"
                    })
                    .option("compgen", {
                        type: "boolean"
                    })
                    .action((options, index: string, prev: string, command: string) => {
                        this.info(parts, options, {
                            index,
                            prev,
                            command
                        });

                        resolve([index, command]);

                        return "1";
                    });
            });

            try {
                const res = await completion.process(parts);

                if(res === "1") {
                    const [index, command] = await promise;

                    const p = this.parseCommand(command);

                    const res = await this.complete(p.length - 1 < parseInt(index) ? [...p, ""] : p);

                    this.info(index, p.length, p, res);

                    return res
                        .map((predict) => {
                            if(/\s/.test(predict)) {
                                return predict.replace(/\s/g, "\\ ");
                            }

                            return predict;
                        })
                        .join(OS.EOL);
                }
            }
            catch(err) {
                this.error(err.message);
            }

            return "";
        }

        return this.process(parts);
    }
}


export {Cli};
