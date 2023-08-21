import {Command} from "./Command";
import {Logger} from "./Logger";

import {generateCompletion} from "../utils";


class Cli extends Command {
    protected scriptPath: string;

    public constructor() {
        super("");
    }

    public completionScript() {
        const name = "cli";

        return generateCompletion(name);
    }

    public async run(argv: string[]) {
        const [nodePath, script, ...parts] = argv;

        this.scriptPath = script;

        // Logger.info("nodePath: ", nodePath);
        // Logger.info("script: ", script);

        if(parts.indexOf("--completion") > -1 || parts.indexOf("--compgen") > -1) {
            return this.complete(parts);
        }

        return this.process(parts);
    }
}


export {Cli};
