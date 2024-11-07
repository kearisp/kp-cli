import {describe, it, afterEach, beforeAll, expect} from "@jest/globals";

import {CommandInput} from "./CommandInput";
import {Logger} from "./Logger";


describe("CommandInput.option", (): void => {
    beforeAll((): void => {
        Logger.mute();
    });

    afterEach((): void => {
        Logger.debug("-".repeat(15));
        Logger.mute();
    });

    it("Should has values", async (): Promise<void> => {
        const input = new CommandInput({name: "test"}, [
            {name: "test1", value: "test1"},
            {name: "test2", value: "test2"},
            {name: "test3", value: "test3"},
        ]);

        expect(input).toBeInstanceOf(CommandInput);
        expect(input.argument("name")).toBe("test");
        expect(input.argument("name2")).toBeUndefined();
        expect(input.arguments()).toEqual({
            name: "test"
        });
        expect(input.option("test")).toBeUndefined();
    });
});
