import {expect, describe, it} from "@jest/globals";

import {Parser} from "./Parser";


describe("Parser.next", () => {
    const parser = new Parser(["foo", "bar"]);

    it("Should correctly progress through parts", () => {
        expect(parser.part).toBe("foo");
        parser.next();
        expect(parser.part).toBe("bar");
        parser.next();
        expect(parser.eol).toBe(true);
    });
});

describe("Parser.isCommand", () => {
    const parser = new Parser(["test"]);

    it("Should validate command", () => {
        expect(parser.isCommand("test")).toBe(true);
        expect(parser.isCommand("<command>")).toBe(true);
        expect(parser.isCommand("/")).toBe(false);
    });
});

describe("Parser.isOption", () => {
    const parser = new Parser(["-n", "a"]);

    it("Should validate option", () => {
        expect(parser.isOption()).toBe(true);
        parser.next();
        expect(parser.isOption()).toBe(false);
    });
});
