import {expect, describe, it, beforeEach, beforeAll} from "@jest/globals";

import {InvalidError} from "../errors/InvalidError";
import {Command} from "./Command";
import {Logger} from "./Logger";


describe("Command.parse", () => {
    beforeAll(() => {
        Logger.mute();
    });

    beforeEach(() => {
        Logger.debug("-".repeat(15));
        Logger.mute();
    });

    it("Should be parsed", async (): Promise<void> => {
        const command = (new Command("test [name]"))
            .help({
                description: "Test description"
            })
            .option("name", {
                type: "string",
                alias: "n"
            });

        expect(command.parse(["test", "John"])).toEqual({
            _arguments: {
                name: "John"
            },
            _options: {}
        });

        expect(command.parse(["test", "John", "-n=test"])).toEqual({
            _arguments: {
                name: "John"
            },
            _options: {
                name: "test"
            }
        });
    });

    it("Should be parsed without optional argument", async () => {
        const command = (new Command("use [name]"));

        expect(command.parse(["use"])).toEqual({
            _arguments: {},
            _options: {}
        });
    });

    it("Should be parsed spread", async (): Promise<void> => {
        Logger.unmute();

        const command = (new Command("config [...config]"));

        expect(command.parse(["config", "--test", "John", "-n=test"])).toEqual({
            _arguments: {
                config: ["--test", "John", "-n=test"]
            },
            _options: {}
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
                _options: {
                    foo: true,
                    bar: true
                }
            });

        expect(command.parse(["cli", "-bf"]))
            .toEqual({
                _arguments: {},
                _options: {
                    foo: true,
                    bar: true
                }
            });

        expect(command.parse(["cli", "-bffbbfbbfbbfbfbfff"]))
            .toEqual({
                _arguments: {},
                _options: {
                    foo: true,
                    bar: true
                }
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
            _options: {
                help: true
            }
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
});

describe("Command.complete", () => {
    const command = (new Command("test [name]"))
        .option("name", {
            type: "string",
            alias: "n"
        })
        .completion("name", () => ["foo", "bar"]);

    beforeEach(() => {
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
            .completion("name", (input) => {
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
});
