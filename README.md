# @kearisp/cli

## Description

Command line interface for node.js


## Installation

```shell
npm install @kearisp/cli
```

## Usage

### Command

```typescript
import {Cli} from "@kearisp/cli";


const cli = new Cli();

cli.command("foo")
    .action(() => {
        return "Foo result";
    });

cli.run(process.argv).then((res) => {
    process.stdout.write(res);
}).catch((err) => {
    process.stderr.write(err.message);
});
```

### Command argument

`<bar>` - required argument

`[bar]` - not required argument

```typescript
cli.command("foo <bar1> [bar2]")
    .action((options, bar1: string, bar2?: string) => {
        return `Foo result, with arguments bar1=${bar1} bar2=${bar2}`;
    });
```

### Command option

Types:

- string
- boolean
- number

```typescript
cli.command("foo")
    .option("bar", {
        type: "string",
        alias: "b"
    })
    .option("init", {
        type: "boolean",
        alias: "i"
    })
    .action((options) => {
        const {
            bar = "",
            init = false
        } = options;

        return `Foo result, with options bar=${bar} init=${init.toString()}`;
    });
```

### Completion

```typescript
cli.command("foo <bar>")
    .completion("bar", () => ["value1", "value2", "value3"])
    .action((options, bar: string) => {
        return `Foo result, with argument bar=${bar}`;
    });

cli.command("completion script")
    .action(() => {
        return cli.completionScript();
    });
```

```shell
source <(your-script.js completion script)
```
