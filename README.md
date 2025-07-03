# @kearisp/cli

[![npm version](https://img.shields.io/npm/v/@kearisp/cli.svg)](https://www.npmjs.com/package/@kearisp/cli)
[![Publish](https://github.com/kearisp/kp-cli/actions/workflows/publish-latest.yml/badge.svg?event=release)](https://github.com/kearisp/kp-cli/actions/workflows/publish-latest.yml)
[![License](https://img.shields.io/npm/l/@kearisp/cli)](https://github.com/kearisp/kp-cli/blob/master/LICENSE)

[![npm total downloads](https://img.shields.io/npm/dt/@kearisp/cli.svg)](https://www.npmjs.com/package/@kearisp/cli)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@kearisp/cli)](https://bundlephobia.com/package/@kearisp/cli)
![Coverage](https://gist.githubusercontent.com/kearisp/f17f46c6332ea3bb043f27b0bddefa9f/raw/coverage-kp-cli-latest.svg)


## Overview

A lightweight and flexible command-line interface framework for Node.js applications. This library provides a robust foundation for building CLI tools with support for commands, arguments, options, help documentation, and shell completion.

### Features

- **Type-safe command definitions** with TypeScript support
- **Flexible argument parsing** (required, optional, and spread arguments)
- **Rich option types** (string, boolean, number)
- **Built-in help generation** for commands and options
- **Shell completion support** for Bash and other shells
- **Custom command actions** with promise-based execution
- **ES Module architecture** for modern JavaScript


## Tech Stack

- **Language:** TypeScript (compiles to ESNext)
- **Module System:** ES Modules (ESM)
- **Package Manager:** npm
- **Testing Framework:** Jest with ts-jest
- **Build Tool:** TypeScript Compiler (tsc)
- **Node.js Types:** @types/node


## Requirements

- **Node.js:** Version supporting ES Modules (recommended: Node.js 14+)
- **npm:** For package installation and script execution


## Installation

Install the package using npm:

```bash
npm install @kearisp/cli
```


## Setup

### For Usage in Your Project

After installing via npm, import the library in your code:

```typescript
import {Cli} from "@kearisp/cli";

const cli = new Cli();
// Define your commands...
```

## Breaking Changes in Version 3.0.0

The `v3.0.0` release introduces several breaking changes aimed at improving API consistency and usability.

* **Argument and Option API:** The methods for accessing command arguments and options have been redesigned.
  * The `input.arguments()` method, which previously returned an object with all arguments, has been replaced by `input.argument("argumentName")` to retrieve the value of a single argument.
  * Similarly, `input.options()`, which returned an object with all options, has been replaced by `input.option("optionName")` to get the value of a single option.
  * To get values from a spread argument, use `input.arguments("spreadArgumentName")`, which returns an array of values.
  * To get all values for an option that can be specified multiple times, use `input.options("optionName")`, which returns an array of values.

Here is a brief comparison:

**Before (v2.x):**

```typescript
// Get argument
const {bar} = input.arguments();

// Get option
const {baz} = input.options();

// Get spread argument
const items = input.argument("items");
```

**After (v3.0.0):**

```typescript
// Get argument
const bar = input.argument("bar");

// Get option
const baz = input.option("baz");

// Get spread argument (returns an array)
const items = input.arguments("items");
```


## Usage

### Basic Command

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

### Command Arguments

Arguments can be required or optional, and support spread syntax:

- `<bar>` - Required argument
- `[bar]` - Optional argument
- `<...bars>` - Required spread argument (array)
- `[...bars]` - Optional spread argument (array)

> ℹ️ The spread is not stable now

```typescript
cli.command("foo <foo1> [foo2]")
    .action((input: CommandInput) => {
        return `Foo result, with arguments foo1=${input.argument("foo1")} foo2=${input.argument("foo2")}`;
    });
```

```typescript
cli.command("bar [...bars]")
    .action((input: CommandInput) => {
        return "Bar result, Bars: " + input.arguments("bars").join(", ");
    });
```

### Command Options

Options support multiple types:

- `string`
- `boolean`
- `number`

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
        const bar = input.option("bar"),
              init = input.option("init");

        return `Foo result, with options bar=${bar} init=${init.toString()}`;
    });
```

### Help Documentation

```typescript
cli.command("foo")
    .help({
        description: "Foo description"
    })
    .option("foo-option", {
        alias: "o",
        description: "Option description"
    })
    .action((input) => {
        const option = input.option("foo-option");

        return `option=${option}`;
    });
```

Display help:

```bash
./cli.js foo -h
```

> Response:
> ```text
> Help:
> Foo description
> 
> --option, -o - Option description
> ```

### Shell Completion

```typescript
cli.command("foo <bar>")
    .completion("bar", () => ["value1", "value2", "value3"])
    .action((input) => {
        const bar = input.argument("bar");

        return `Foo result, with argument bar=${bar}`;
    });

cli.command("completion script")
    .action(() => {
        return cli.completionScript();
    });
```

#### Bash Completion

Enable completion in your shell:

```bash
source <(your-script.js completion script)
```


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

**Copyright (c) 2021 Kris Papercut**


## Links

- **npm Package:** https://www.npmjs.com/package/@kearisp/cli
- **GitHub Repository:** https://github.com/kearisp/kp-cli
- **Issue Tracker:** https://github.com/kearisp/kp-cli/issues


## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to the GitHub repository.
