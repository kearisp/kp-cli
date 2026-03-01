import {expect, describe, it, beforeEach, afterEach} from "@jest/globals";
import * as OS from "os";
import {Cli, Logger} from "..";


describe("Cli.run", (): void => {
    beforeEach((): void => {
        Logger.mute();
    });

    afterEach((): void => {
        Logger.debug("-".repeat(10));
        Logger.mute();
    });

    it("should be processed simple command", async (): Promise<void> => {
        const cli = new Cli();

        cli.command("completion")
            .action(() => cli.completionScript());
        cli.command("init")
            .action(() => {
                return "Init";
            });

        expect(await cli.run(["node", "cli", "init"])).toBe("Init");
    });

    it("should be processed command with argument", async (): Promise<void> => {
        const cli = new Cli();

        cli.command("process <name>")
            .action((input) => {
                return input.argument("name");
            });

        const res = await cli.run(["node", "cli", "process", "process-name"]);

        expect(res).toBe("process-name");
    });

    it("should be processed with option", async (): Promise<void> => {
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

    it("should be completed", async (): Promise<void> => {
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

        expect(await cli.run(["node", "cli", "complete", "--compbash", "--compgen", "1", "cli proc"]))
            .toEqual("process");

        expect(await cli.run(["node", "cli", "complete", "--compbash", "--compgen", "1", "cli "]))
            .toEqual(["init", "start", "process"].join(OS.EOL));

        expect(await cli.run(["node", "cli", "complete", "--compbash", "--compgen", "2", "cli start -"]))
            .toEqual(["-f", "--foo"].join(OS.EOL));

        expect(await cli.run(["node", "cli", "complete", "--compbash", "--compgen", "2", "ws start --foo "]))
            .toEqual("");
    });

    it("should be help", async (): Promise<void> => {
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

    it("should be help without required argument", async (): Promise<void> => {
        Logger.unmute();

        const cli = new Cli();

        cli.command("run <action>")
            .help({
                description: "Run description"
            });

        const res = await cli.run(["node", "cli", "run", "-h"]);

        expect(res).toContain("Run description");
        expect(res).toContain("run <action>");
    });

    it("should handle empty command with options", async (): Promise<void> => {
        const cli = new Cli();

        cli.command("")
            .option("version", {
                alias: "v",
                type: "boolean"
            })
            .action((input) => {
                if(input.option("version")) {
                    return "v1.0.0";
                }

                return "Some result";
            });

        expect(await cli.run(["node", "cli"]).catch((err) => err)).toBe("Some result");
        expect(await cli.run(["node", "cli", "-v"]).catch((err) => err)).toBe("v1.0.0");
    });
});
