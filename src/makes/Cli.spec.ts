import * as assert from "assert";
import {expect, describe, it} from "@jest/globals";

import {Cli} from "./Cli";


const cli = new Cli();

cli.command("init")
    .option("name", {
        type: "string",
        alias: "n"
    })
    .completion("name", () => ["foo", "bar"])
    .action(() => {
        return "init";
    });

cli.command("test:<command>")
    .option("name", {
        type: "string",
        alias: "n"
    })
    .completion("command", () => ["command"])
    .action((options, command: string) => {
        const {
            name = ""
        } = options;

        return `${command}:${name}`;
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
        return database || "";
    });

cli.command("config:set [...configs]")
    .action((options, configs) => {
        return (configs as string[]).join(",");
    });

cli.command("domain:add <...domain>")
    .completion("domain", () => {
        return ["foo.ws", "test.ws", "test-2.ws"];
    })
    .option("bool", {
        type: "boolean"
    })
    .action((options, domains) => {
        return (domains as string[]).join(",");
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

    it("config:set [...configs]", () => {
        const res = cli.command("config:set [...configs]")
            .parse(["config:set", "KEY=value", "KEY2=value2"]);

        assert.deepStrictEqual(res, {
            args: [
                ["KEY=value", "KEY2=value2"]
            ],
            options: {},
            parts: []
        });
    });

    it("domain:add <...domain>", () => {
        const command = cli.command("domain:add <...domain>");

        assert.deepEqual(command.parse(["domain:add", "test.ws", "test-2.ws"]), {
            args: [["test.ws", "test-2.ws"]],
            options: {},
            parts: []
        });

        const res2 = command.parse(["domain:add", "--bool", "test.ws"]);

        assert.deepEqual(res2, {
            args: [["test.ws"]],
            options: {
                bool: true
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

        expect(res).toBe("action:project");
    });

    it("missed", async () => {
        const res = await cli.process(["missed"]);

        console.log(res);

        expect("").toBe("");
    });

    // it("ws exec -d mysql test", async () => {
    //     const res = await cli.process(["ws", "exec", "-d", "mysql", "test"]);
    //
    //     expect("").toBe("");
    // });

    // it("ws", async () => {
    //     const res = await cli.process(["init", "-n", "test"]);
    //
    //     expect("").toBe("");
    // });
});

describe("Cli.complete", () => {
    it("i", async () => {
        const res = await cli.complete(["i"]);

        assert.deepStrictEqual(res, ["init"]);
    });

    it("test", async () => {
        const res = await cli.complete(["test", ""]);

        assert.deepStrictEqual(res, ["foo", "bar"]);
    });

    it("test:", async () => {
        const res = await cli.complete(["test:"]);

        assert.deepStrictEqual(res, ["test:command"]);
    });

    it("domain:add <..domains>", async () => {
        const res = await cli.complete(["domain:add", "test"]);

        assert.deepEqual(res, ["foo.ws", "test.ws", "test-2.ws"]);
    });
});

describe("Cli.run", () => {
    const run = async (args: string[]) => {
        try {
            const res = await cli.run(args);

            return [res, null];
        }
        catch(err) {
            return [null, err];
        }
    };

    it("init", async () => {
        const [res, err] = await run([
            "/bin/node",
            "/bin/command",
            "init"
        ]);

        expect(res).toBe("init");
        expect(err).toBeNull();
    });

    it("not-found", async () => {
        const [res, err] = await run([
            "/bin/node",
            "/bin/command",
            "not-found"
        ]);

        expect(res).toBeNull();
        expect(err).toBeDefined();
        expect(err).toBeInstanceOf(Error);
    });

    it("config:set [...configs]", async () => {
        const [res, err] = await run([
            "/bin/node",
            "/bin/command",
            "config:set",
            "TEST=1",
            "TEST=2"
        ]);

        expect(res).toBe("TEST=1,TEST=2");
        expect(err).toBeNull();
    });

    it("domain:add <...domains>", async () => {
        const [res, err] = await run([
            "/bin/node",
            "/bin/command",
            "domain:add",
            "foo",
            "bar"
        ]);

        expect(res).toBe("foo,bar");
        expect(err).toBeNull();
    });
});
