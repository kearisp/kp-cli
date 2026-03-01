import {Cli} from "./Cli";
import {Option} from "../types";
import {Command} from "./Command";
import {CommandInput} from "./CommandInput";


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

export class CommandBuilder {
    public constructor(
        protected readonly cli: Cli,
        protected readonly command: Command
    ) {}

    public option(name: string, params: Omit<Option, "name">): this {
        this.command.option(name, params);

        return this;
    }

    public description(description: string): this {
        this.command.setDescription(description);

        return this;
    }

    /**
     * @deprecated
     * @see description
     */
    public setDescription(description: string): this {
        return this.description(description);
    }

    public help(params: HelpParams): this {
        this.command.help(params);

        return this;
    }

    public action(action: Action): this {
        this.command.action(action);

        return this;
    }

    public completion(name: Completion["name"], handle: Completion["action"]): this {
        this.command.completion(name, handle);

        return this;
    }
}
