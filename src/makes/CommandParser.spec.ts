import {describe, it, expect, beforeEach, afterEach} from "@jest/globals";
import {CommandParser} from "./CommandParser";
import {Logger} from "./Logger";
import {OptionValue} from "../types";


describe("CommandParser", (): void => {
    beforeEach((): void => {
        Logger.mute();
    });

    afterEach((): void => {
        Logger.debug("-".repeat(10));
        Logger.mute();
    });

    it("should parse", (): void => {
        Logger.unmute();

        const parser = new CommandParser("init <name> <value>");

        console.log(parser.parse("init"));
        parser.next();
        console.log(parser.parse("foo"));
    });
});
