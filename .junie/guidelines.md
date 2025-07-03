# Development Guidelines for @kearisp/cli

## Build Configuration

### TypeScript Setup
The project uses TypeScript with two configuration files:

- **`tsconfig.json`**: Main TypeScript configuration
  - Target: ESNext
  - Module: ESNext
  - Module Resolution: node
  - Output Directory: `./lib`
  - Generates declaration files (`.d.ts`)
  - Removes comments from output
  - Incremental compilation with `.tsbuildinfo` file in `lib/`

- **`tsconfig.build.json`**: Production build configuration
  - Extends `tsconfig.json`
  - Excludes test files (`**/*test.ts`, `**/*spec.ts`, `**/*e2e-spec.ts`)
  - Used by the `npm run build` command

### Build Commands

```bash
# Build the project (used before publishing)
npm run build

# Watch mode for development
npm run watch
```

The build process:
1. Compiles TypeScript files from `src/` to `lib/`
2. Generates type declaration files
3. Excludes all test files from the build output

### Important Note on Module Type
The project uses `"type": "module"` in `package.json`, meaning it's an ES module package.

## Testing

### Test Configuration

The project uses Jest with `ts-jest` preset for testing TypeScript files.

**Key Jest Configuration Details** (`jest.config.ts`):
- **Test Location**: Tests can be in both `src/` and `test/` directories
- **Test Pattern**: Files matching `**/?(*.)+(spec|test).[tj]s?(x)`
- **Coverage**: Enabled by default, outputs to `coverage/` directory
- **Coverage Providers**: v8 (faster than babel)
- **Setup File**: `test/setup.ts` redirects console methods to custom Logger
- **Module Mapping**: `src/` is mapped for imports in tests
- **Important**: The `rootDir` should be set to `"."` (not `import.meta.dirname` due to TypeScript compatibility issues)

### Test Environment Variable

Tests should be run with `KP_LOG=disable` to suppress logging output:

```bash
npm test
```

This environment variable is set automatically in the `package.json` test script.

### Running Tests

```bash
# Run all tests with coverage
npm test

# Watch mode for all tests
npm run test-watch

# Watch specific test files
npm run test-watch:cli      # Watches Cli.spec.ts
npm run test-watch:command  # Watches Command.spec.ts
npm run test-watch:parser   # Watches Parser.spec.ts
```

After tests run, a coverage badge is automatically generated at `coverage/badge.svg` via the `posttest` script.

### Writing Tests

Tests are co-located with source files in the `src/` directory (e.g., `Command.ts` has `Command.spec.ts` in the same directory).

**Basic Test Structure:**

```typescript
import {expect, describe, it, beforeAll, afterEach} from "@jest/globals";
import {Logger} from "../Logger";

describe("Your Test Suite", (): void => {
    beforeAll((): void => {
        Logger.mute();  // Mute logger output in tests
    });

    afterEach((): void => {
        Logger.debug("-".repeat(15));
        Logger.mute();
    });

    it("should test something", async (): Promise<void> => {
        // Your test code
        expect(result).toBe(expected);
    });
});
```

**Common Patterns in This Project:**
- Always import test functions from `@jest/globals`
- Use `Logger.mute()` in `beforeAll` to suppress console output
- Tests often use async/await with `Promise<void>` return type
- Use explicit type annotations for test functions

**Example Test:**

```typescript
import {expect, describe, it} from "@jest/globals";

describe("Example Test Suite", (): void => {
    it("should pass a basic test", (): void => {
        const result = 2 + 2;
        expect(result).toBe(4);
    });

    it("should work with arrays", (): void => {
        const items = ["foo", "bar", "baz"];
        expect(items).toHaveLength(3);
        expect(items).toContain("bar");
    });
});
```

### Adding New Tests

1. Create a new file with `.spec.ts` extension in the `src/` directory (or subdirectory)
2. Import test functions from `@jest/globals`
3. Follow the existing patterns (use Logger.mute(), async functions, etc.)
4. Run `npm test` to execute all tests including your new ones

## Code Style and Development Notes

### Project Structure

```
kp-cli/
├── src/                     # Source code (TypeScript)
│   ├── makes/               # Core implementation
│   │   ├── Cli.ts           # Main CLI class
│   │   ├── Cli.spec.ts      # CLI tests
│   │   ├── Command.ts       # Command implementation
│   │   ├── Command.spec.ts  # Command tests
│   │   ├── CommandBuilder.ts # Command builder
│   │   ├── CommandInput.ts  # Input handling
│   │   ├── CommandInput.spec.ts
│   │   ├── CommandParser.ts # Command parsing
│   │   ├── CommandParser.spec.ts
│   │   ├── Logger.ts        # Custom logger
│   │   ├── Logger.spec.ts
│   │   ├── OptionParser.ts  # Option parsing
│   │   ├── Parser.ts        # Main parser
│   │   ├── Parser.spec.ts
│   │   └── index.ts         # Exports
│   ├── errors/              # Custom error classes
│   │   ├── CommandNotFoundError.ts
│   │   ├── CommandWithoutAction.ts
│   │   ├── InvalidError.ts
│   │   └── index.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── DefinitionMeta.ts
│   │   ├── Option.ts
│   │   ├── Param.ts
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── escapeRegExp.ts
│   │   ├── generateCompletion.ts
│   │   ├── isCommand.ts
│   │   ├── isSpread.ts
│   │   └── index.ts
│   ├── env.ts               # Environment configuration
│   └── index.ts             # Main entry point
├── test/                    # Test utilities
│   └── setup.ts             # Jest setup file
├── lib/                     # Compiled output (generated, not in git)
├── coverage/                # Test coverage reports (generated)
├── jest.config.ts           # Jest configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.build.json      # Production build config
├── package.json             # Package metadata and scripts
└── LICENSE                  # MIT License
```

### Import Conventions
- Use ES module imports (`import`/`export`)
- Path mapping for `src/` is configured in both TypeScript and Jest
- Import test utilities from `@jest/globals`

### Logger Usage
The project has a custom Logger class that's used throughout:
- Console methods are redirected to Logger in test setup
- Use `Logger.mute()` to disable logging in tests
- Use `Logger.unmute()` when you need to debug tests
- The `KP_LOG=disable` environment variable controls logger behavior

### Development Workflow

1. **Making Changes:**
   ```bash
   npm run watch  # Start TypeScript compiler in watch mode
   ```

2. **Testing During Development:**
   ```bash
   npm run test-watch  # Run tests in watch mode
   # Or use specific watch scripts for individual test files
   ```

3. **Before Committing:**
   ```bash
   npm test  # Ensure all tests pass
   npm run build  # Ensure the project builds successfully
   ```

4. **Pre-publish:**
   The `prepublishOnly` script automatically runs `npm run build` before publishing

### TypeScript Strictness
Note that strict type checking is NOT enabled in this project. The tsconfig has most strict flags commented out, allowing more flexibility but requiring developers to be careful with types.

## Troubleshooting

### Jest Configuration Issue
If you encounter an error about `import.meta.dirname` in `jest.config.ts`, ensure the `rootDir` is set to `"."` instead of `import.meta.dirname`. This is due to TypeScript module settings compatibility.

### Test Failures Related to Logging
If tests are failing with unexpected console output, ensure:
1. The `KP_LOG=disable` environment variable is set
2. `Logger.mute()` is called in test setup
3. Check that `test/setup.ts` is being loaded (configured in `jest.config.ts`)
