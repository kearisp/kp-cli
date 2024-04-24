import {expect, describe, it, beforeEach} from "@jest/globals";

import {InvalidError} from "../errors/InvalidError";
import {Command} from "./Command";
import {Logger} from "./Logger";


describe("Command.parse", () => {
    beforeEach(() => {
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
            args: {
                name: "John"
            },
            options: {}
        });

        expect(command.parse(["test", "John", "-n=test"])).toEqual({
            args: {
                name: "John"
            },
            options: {
                name: "test"
            }
        });
    });

    it("Should be parsed spread", async (): Promise<void> => {
        const command = (new Command("config [...config]"));

        expect(command.parse(["config", "John", "-n=test"])).toEqual({
            args: {
                config: ["John", "-n=test"]
            },
            options: {}
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
            args: {
                name: "test"
            },
            options: {
                help: true
            }
        });
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

    it("Should predict second argument", async (): Promise<void> => {
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

            throw Error("Completed successfully");
        }
        catch(err) {
            expect(err).toBeInstanceOf(Error);
        }
    });

    it("Should has argument in input", async () => {
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
