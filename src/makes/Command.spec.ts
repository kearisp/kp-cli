import {expect, describe, it, afterEach, beforeAll} from "@jest/globals";

import {InvalidError} from "../errors/InvalidError";
import {Command} from "./Command";
import {Logger} from "./Logger";


describe("Command.parse", (): void => {
    beforeAll((): void => {
        Logger.mute();
    });

    afterEach((): void => {
        Logger.debug("-".repeat(15));
        Logger.mute();
    });

    it("Should be parsed", async (): Promise<void> => {
        const command = (new Command("test [name]"))
            .setDescription("Test description")
            .help({
                description: "Test description"
            })
            .option("name", {
                type: "string",
                alias: "n"
            });

        let input = command.parse(["test", "John"]);

        expect(input.argument("name")).toBe("John");
        expect(input.options()).toEqual([]);

        input = command.parse(["test", "John", "-n=test"]);

        expect(input.argument("name")).toBe("John");
        expect(input.option("name")).toBe("test");
    });

    it("Should be parsed without optional argument", async () => {
        const command = (new Command("use [name]"));

        expect(command.parse(["use"])).toEqual({
            _arguments: {},
            _options: []
        });
    });

    it("Should be parsed spread", async (): Promise<void> => {
        const command = (new Command("config [...config]"));

        expect(command.parse(["config", "John", "--test", "-n=test"])).toEqual({
            _arguments: {
                config: ["John", "--test", "-n=test"]
            },
            _options: []
        });
    });

    it("Should be parsed multiple options", async (): Promise<void> => {
        const command = (new Command("cli"))
            .option("foo", {
                type: "boolean",
                alias: "f"
            })
            .option("bar", {
                type: "boolean",
                alias: "b"
            })
            .option("arr", {
                type: "boolean",
                alias: "a"
            });

        expect(command.parse(["cli", "-fb"]))
            .toEqual({
                _arguments: {},
                _options: [
                    {name: "foo", value: true},
                    {name: "bar", value: true}
                ]
            });

        expect(command.parse(["cli", "-bf"]))
            .toEqual({
                _arguments: {},
                _options: [
                    {name: "bar", value: true},
                    {name: "foo", value: true}
                ]
            });

        Logger.unmute();
        Logger.info(command.parse(["cli", "-bff"]));
        expect(command.parse(["cli", "-bff"]))
            .toEqual({
                _arguments: {},
                _options: [
                    {name: "bar", value: true},
                    {name: "foo", value: true},
                    {name: "foo", value: true}
                ]
            });
    });

    it("Should be help", async (): Promise<void> => {
        const command = (new Command("test [name]"))
            .help({
                description: "Test description"
            })
            .option("name", {
                type: "string",
                alias: "n"
            });

        expect(command.parse(["test", "test", "--help"])).toEqual({
            _arguments: {
                name: "test"
            },
            _options: [
                {name: "help", value: true}
            ]
        });
    });

    it("Should be error without required argument", async (): Promise<void> => {
        const command = new Command("use <name>");

        try {
            command.parse(["use"]);

            throw new Error("Completed successfully");
        }
        catch(err) {
            expect(err).toBeInstanceOf(InvalidError);
        }
    });

    it("Should be options", async (): Promise<void> => {
        const command = new Command("command")
            .option("name", {
                type: "string",
                alias: "n"
            })
            .option("description", {
                type: "string",
                // array: true,
                alias: "d"
            });

        const input = command.parse([
            "command",
            "-n=test1", "-n=test2", "-n=test3",
            "-d=desc1", "-d=desc2"
        ]);

        expect(input.options("name")).toEqual(["test1", "test2", "test3"]);
        expect(input.option("description")).toBe("desc1");
        expect(input.options("test")).toEqual([]);
        expect(input.option("test")).toBeUndefined();
    });
});

describe("Command.complete", (): void => {
    const command = (new Command("test [name]"))
        .option("name", {
            type: "string",
            alias: "n"
        })
        .completion("name", () => ["foo", "bar"]);

    beforeAll((): void => {
        Logger.mute();
    });

    afterEach((): void => {
        Logger.debug("-".repeat(15));
        Logger.mute();
    });

    it("Should predict first command", async (): Promise<void> => {
        const res = await command.complete(["te"]);

        expect(res).toEqual(["test"]);
    });

    it("Should predict optional argument", async (): Promise<void> => {
        const res = await command.complete(["test", ""]);

        expect(res).toEqual(["foo", "bar"]);
    });

    it("Should predict option name", async (): Promise<void> => {
        const res = await command.complete(["test", "foo", "-"]);

        expect(res).toEqual(["-n", "--name"])
    });

    it("Should predict option value", async (): Promise<void> => {
        const command = (new Command("test"))
            .option("name", {
                type: "string",
                alias: "n",
                description: "Test description"
            })
            .option("arr", {
                type: "string",
                alias: "a",
                description: "Array"
            })
            .completion("name", () => {
                return ["foo", "bar"];
            });

        expect(await command.complete(["test", "-a=1", "-n", ""])).toEqual(["foo", "bar"]);
    });

    it("Should predict second argument depends on first", async (): Promise<void> => {
        const command = (new Command("[arg1] [arg2]"))
            .completion("arg2", (input) => {
                if(input.argument("arg1") === "foo") {
                    return ["right"];
                }

                return ["wrong"];
            });

        const res = await command.complete(["foo", ""]);

        expect(res).toEqual(["right"]);
    });

    it("Should predict spread", async (): Promise<void> => {
        const command = (new Command("[...name]"))
            .completion("name", () => {
                return ["foo", "bar"];
            });

        expect(await command.complete([""])).toEqual(["foo", "bar"]);
        expect(await command.complete(["foo", ""])).toEqual(["bar"]);
    });

    it("Should throw error on command", async (): Promise<void> => {
         const command = new Command("test [name]");

        try {
            await command.complete(["lest", "lol"]);

            throw Error("Completed successfully");
        }
        catch(err) {
            expect(err).toBeInstanceOf(InvalidError);
        }
    });

    it("Should throw error on option", async (): Promise<void> => {
        try {
            await command.complete(["test", "foo", "--no"]);

            throw new Error("Completed successfully");
        }
        catch(err) {
            expect(err).toBeInstanceOf(Error);
        }
    });

    it("Should has argument in input", async (): Promise<void> => {
        const command = (new Command("[arg1] [arg2]"))
            .completion("arg1", () => {
                return ["test"];
            })
            .completion("arg2", (input) => {
                expect(input.argument("arg1")).toBe("test");

                return ["test"];
            });

        await command.complete(["test"]);
    });

    it("Should has current argument in input", async (): Promise<void> => {
        const command = (new Command("<arg1> <arg2>"))
            .completion("arg1", (input): string[] => {
                expect(input.argument("arg1")).toBe("123");

                return [];
            });

        await command.complete(["123"]);
    });
});
