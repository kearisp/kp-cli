import {expect, describe, it, beforeEach} from "@jest/globals";
import * as OS from "os";
// import * as assert from "assert";

import {Logger} from "./Logger";
import {Cli} from "./Cli";


describe("Cli.run", () => {
    beforeEach(() => {
        Logger.mute();
    });

    it("Should be processed simple command", async (): Promise<void> => {
        const cli = new Cli();

        cli.command("completion")
            .action(() => cli.completionScript());
        cli.command("init")
            .action(() => {
                return "Init";
            });

        expect(await cli.run(["node", "cli", "init"])).toBe("Init");
    });

    it("Should be processed command with argument", async (): Promise<void> => {
        const cli = new Cli();

        cli.command("process <name>")
            .action((input) => {
                return input.argument("name");
            });

        const res = await cli.run(["node", "cli", "process", "process-name"]);

        expect(res).toBe("process-name");
    });

    it("Should be processed with option", async (): Promise<void> => {
        const cli = new Cli();

        cli.command("process")
            .option("name", {
                type: "string",
                alias: "n"
            })
            .action((input) => {
                return input.option("name", "");
            });

        expect(await cli.run(["node", "cli", "process", "--name=test"])).toBe("test");
        expect(await cli.run(["node", "cli", "process", "--name", "test"])).toBe("test");
        expect(await cli.run(["node", "cli", "process", "-n=test"])).toBe("test");
        expect(await cli.run(["node", "cli", "process", "-n", "test"])).toBe("test");
    });

    it("Should be completed", async (): Promise<void> => {
        const cli = new Cli();

        cli.command("init");
        cli.command("start")
            .option("foo", {
                type: "boolean",
                alias: "f",
                description: "Foo"
            });
        cli.command("process <name>")
            .completion("name", () => {
                return ["foo", "bar"];
            })
            .action((input) => {
                return input.argument("name");
            });

        expect(await cli.run(["node", "cli", "complete", "--compbash", "--compgen", "1", "process", "cli proc"]))
            .toEqual("process");

        expect(await cli.run(["node", "cli", "complete", "--compbash", "--compgen", "1", "cli", "cli "]))
            .toEqual(["init", "start", "process"].join(OS.EOL));

        expect(await cli.run(["node", "cli", "complete", "--compbash", "--compgen", "2", "cli", "cli start -"]))
            .toEqual(["-f", "--foo"].join(OS.EOL));
    });

    it("Should be help", async (): Promise<void> => {
        const cli = new Cli();

        cli.command("completion").action(() => {
            return cli.completionScript();
        });

        cli.command("init")
            .help({
                description: "Init description"
            })
            .option("option", {
                type: "boolean",
                description: "Option description"
            })
            .option("name", {
                type: "string",
                alias: "n",
                description: "Name description"
            });

        const res = await cli.run(["node", "cli", "init", "-h"]);

        expect(res).toContain("Init description");
        expect(res).toContain("Option description");
        expect(res).toContain("Name description");
        expect(res).toContain("cli init");
        expect(res).toContain("--name");
        expect(res).toContain("--option");
    });
});
