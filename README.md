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

> ℹ️ The spread is not stable now

`<...bars>` - required spread argument

`[...bars]` - not required spread argument

```typescript
cli.command("foo <foo1> [foo2]")
    .action((input: CommandInput) => {
        return `Foo result, with arguments foo1=${input.argument("foo1")} foo2=${input.argument("foo2")}`;
    });
```

```typescript
cli.command("bar [...bars]")
    .action((input: CommandInput) => {
        return "Bar result, Bars: " + input.argument("bars").join(", ");
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
    .action((input: CommandInput) => {
        const {
            bar = "",
            init = false
        } = input.options();

        return `Foo result, with options bar=${bar} init=${init.toString()}`;
    });
```

### Help

```typescript
cli.command("foo")
    .help({
        description: "Foo description"
    })
    .option("option", {
        alias: "o",
        description: "Option description"
    })
    .action((input) => {
        const {
            option = ""
        } = input.options();

        return `option=${option}`;
    });
```

```shell
./cli.js foo -h
```

> Response:
> ```text
> Help:
> Foo description
> 
> --option, -o - Option description
> ```


### Completion

```typescript
cli.command("foo <bar>")
    .completion("bar", () => ["value1", "value2", "value3"])
    .action((input) => {
        const {
            bar = ""
        } = input.arguments();

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
