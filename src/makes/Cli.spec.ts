import * as fs from "fs";
import * as Path from "path";
import * as assert from "assert";

import {Cli} from "./Cli";
import {Logger} from "./Logger";


const cli = new Cli();

fs.writeFile(Path.join(__dirname, "../..", "s.sh"), cli.completionScript(), () => {
    //
});

// fs.createWriteStream();
// fs.write(cli.completionScript());

cli.command("init")
    .option("name", {
        type: "string",
        alias: "n"
    })
    .completion("name", () => ["foo", "bar"])
    .action(() => {
        return "init";
    });

// cli.command("start")
//     .option("name", {
//         type: "string",
//         alias: "n"
//     })
//     .action((options) => {
//         return "";
//     });

cli.command("test:<command>")
    .option("name", {
        type: "string",
        alias: "n"
    })
    .completion("command", () => ["command"])
    .action((options, command: string) => {
        return "";
    });

cli.command("test [action]")
    .option("user", {
        type: "string",
        alias: "u",
        description: "User name"
    })
    .option("password", {
        type: "string",
        alias: "p",
        description: "User password"
    })
    .completion("action", () => ["foo", "bar"])
    .action((options, action: string = "") => {
        const {
            user = "",
            password = ""
        } = options;

        return `${user}:${password}@${action}`;
    });

cli.command("exec")
    .option("detach", {
        type: "boolean",
        alias: "d"
    })
    .command("mysql [database]")
    .completion("database", () => ["foo", "bar"])
    .action((options, database?: string) => {
        return "";
    });

describe("Cli.parse", () => {
    it("init", () => {
        const res = cli.command("init").parse(["init"]);

        assert.deepStrictEqual(res, {
            args: [],
            options: {},
            parts: []
        });
    });

    it("test:<command>", () => {
        const res = cli.command("test:<command>").parse(["test:command"]);

        assert.deepStrictEqual(res, {
            args: ["command"],
            options: {},
            parts: []
        });
    });

    it("test:<command> -n=foo", () => {
        const res = cli.command("test:<command>").parse(["test:command", "-n=foo"]);

        assert.deepStrictEqual(res, {
            args: ["command"],
            options: {
                name: "foo"
            },
            parts: []
        });
    });

    it("test:<command> --name foo", () => {
        const res = cli.command("test:<command>").parse(["test:command", "--name", "foo"]);

        assert.deepStrictEqual(res, {
            args: ["command"],
            options: {
                name: "foo"
            },
            parts: []
        });
    });
});

describe("Cli.process", () => {
    it("init", async () => {
        const res = await cli.process(["init"]);

        expect(res).toBe("init");
    });

    it("test", async () => {
        const res = await cli.process(["test"]);

        expect(res).toBe(":@");
    });

    it("test action -u=foo -p=bar", async () => {
        const res = await cli.process(["test", "action", "-u=foo", "-p=bar"]);

        expect(res).toBe("foo:bar@action");
    });

    it("test action -u foo -p bar", async () => {
        const res = await cli.process(["test", "action", "-u", "foo", "-p", "bar"]);

        expect(res).toBe("foo:bar@action");
    });

    it("test:action", async () => {
        const res = await cli.process(["test:action", "-n", "project"]);

        expect("").toBe("");
    });

    // it("ws exec -d mysql test", async () => {
    //     const res = await cli.process(["ws", "exec", "-d", "mysql", "test"]);
    //
    //     expect("").toBe("");
    // });
    //
    // it("ws", async () => {
    //     const res = await cli.process(["init", "-n", "test"]);
    //
    //     expect("").toBe("");
    // });
});

describe("Cli.complete", () => {
    it("i", async () => {
        const res = await cli.complete(["i"]);

        Logger.warning("(i)", res);

        expect("").toBe("");
    });

    it("test", async () => {
        const res = await cli.complete(["test", ""]);

        Logger.warning("(test)", res);

        expect("").toBe("");
        // expect(res).toBe
    });

    it("ws test:", async () => {
        const res = await cli.complete(["ws", "test:"]);

        Logger.warning("(ws test:)", res);

        expect("").toBe("");
    });
});
