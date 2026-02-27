# Phase 1: Project Initialization & Basic CLI - Research

**Researched:** 2024-07-30
**Domain:** Command-Line Interface (CLI) Development, Node.js File System Operations
**Confidence:** HIGH

## Summary

This research focuses on establishing the foundational command-line interface (CLI) for the Kline Data Fetcher, allowing users to specify an output directory. The investigation recommends using **Commander.js** for argument parsing due to its lightweight nature, widespread adoption, and suitability for common CLI tasks. For file system interactions, the built-in Node.js `fs.promises` module is the standard. It will be used to ensure the specified directory exists and is writable, creating it if necessary. The primary goal is to provide a robust and user-friendly entry point for the application.

**Primary recommendation:** Use Commander.js for CLI argument parsing and Node.js `fs.promises` for directory validation and creation.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FR2 | The system shall allow the user to specify a local directory path for storing the downloaded data. | Commander.js allows easy definition of command-line options for path arguments. |
| NFR3 | The system shall provide a clear and intuitive command-line interface (CLI) for users to specify parameters such as the data storage path, symbols, and kline intervals. | Commander.js is a robust framework for building CLIs, handling arguments, and generating help messages, ensuring NFR3 is met for the output path in this phase. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | ^12.0.0 (latest stable) | Command-line argument parsing and CLI structure | Lightweight, widely adopted, simple API, good for general-purpose CLIs. |
| Node.js `fs.promises` module | N/A (built-in) | Asynchronous file system operations | Native Node.js module, no external dependencies, high performance. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| - | - | - | - |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| commander | yargs | Yargs offers more advanced features like complex validation and nested commands out-of-the-box but has a slightly more verbose syntax and might be overkill for this phase's simple requirements. |
| commander | oclif | Oclif is designed for very large, enterprise-grade CLIs with many subcommands. It has a steeper learning curve and is excessive for a simple data fetching tool. |

**Installation:**
```bash
npm install commander
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cli.js             # Main CLI entry point (Commander.js setup, argument parsing)
├── utils/
│   └── fs-utils.js    # Utility functions for file system operations (e.g., validateDirectory)
└── index.js           # Core application logic (if separate from CLI parsing)
```

### Pattern 1: Commander.js CLI Setup
**What:** Define CLI commands, options, and actions using Commander.js. This pattern establishes the entry point for the application and handles all command-line input.
**When to use:** For any Node.js application requiring command-line interaction.
**Example:**
```typescript
// Source: https://commanderjs.com/
const { Command } = require('commander');
const program = new Command();

program
  .name('kline-fetcher')
  .description('CLI to fetch kline data from Binance Vision')
  .version('0.0.1');

program.command('fetch')
  .description('Fetch kline data for a symbol')
  .option('-o, --output-dir <path>', 'Specify the output directory for data storage', './data')
  .action(async (options) => {
    console.log('Fetching data...');
    console.log('Output Directory:', options.outputDir);
    // Call validation logic here
  });

program.parse();
```

### Pattern 2: Asynchronous File System Validation
**What:** Using `fs.promises` to asynchronously check directory existence and write permissions. This avoids blocking the event loop and handles common file system errors gracefully.
**When to use:** Any time file system interactions are required in an asynchronous Node.js application.
**Example:**
```typescript
// Source: Node.js official documentation (https://nodejs.org/api/fs.html)
const fs = require('fs').promises;
const path = require('path');
const { constants } = require('fs');

async function validateAndPrepareOutputDir(dirPath) {
  const absolutePath = path.resolve(dirPath);
  try {
    // Attempt to create directory recursively.
    // If it exists, this will typically do nothing unless it's a file.
    await fs.mkdir(absolutePath, { recursive: true });
    
    // Check for write access
    await fs.access(absolutePath, constants.W_OK);
    console.log(`Output directory '${absolutePath}' exists and is writable.`);
    return absolutePath;
  } catch (error) {
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: Cannot write to '${absolutePath}'.`);
    }
    if (error.code === 'EEXIST' && (await fs.stat(absolutePath)).isFile()) {
        throw new Error(`Path '${absolutePath}' exists but is a file, not a directory.`);
    }
    if (error.code === 'ENOENT') {
        throw new Error(`Output directory '${absolutePath}' does not exist and could not be created.`);
    }
    throw new Error(`Failed to access or create output directory '${absolutePath}': ${error.message}`);
  }
}

// Usage in CLI action:
// .action(async (options) => {
//   try {
//     const outputDir = await validateAndPrepareOutputDir(options.outputDir);
//     // proceed with data fetching
//   } catch (error) {
//     console.error('Error:', error.message);
//     process.exit(1);
//   }
// });
```

### Anti-Patterns to Avoid
-   **Synchronous File System Calls in CLI**: Avoid `fs.existsSync`, `fs.mkdirSync`, etc., in the main CLI logic. While they might seem simpler, they block the event loop, leading to poor performance and an unresponsive CLI, especially if operations take time on slow disks or network drives. Use `fs.promises` for asynchronous operations.
-   **Blindly trusting user input**: Always sanitize and validate user-provided paths. Commander.js helps with basic parsing, but further validation (like path resolution and permission checks) is crucial.
-   **Using `fs.access` to check existence before `fs.mkdir`**: This introduces a race condition. It's better to attempt `fs.mkdir` directly with `recursive: true` and handle specific error codes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI argument parsing and help generation | Custom `process.argv` parsing, manual help messages | `commander.js` | Handles complex parsing, option validation, default values, and generates professional help output automatically, reducing boilerplate and potential bugs. |
| Cross-platform directory creation and permission checks | Custom OS-specific shell commands, manual permission bit parsing | Node.js `fs.promises` (e.g., `mkdir`, `access`) | Provides a consistent, cross-platform API for file system operations, abstracting away OS differences and handling asynchronous execution. |

**Key insight:** Core CLI and file system functionalities are complex to implement robustly from scratch across different operating systems and user environments. Leveraging battle-tested libraries and native modules ensures reliability, maintainability, and security.

## Common Pitfalls

### Pitfall 1: Race Conditions with File System Checks
**What goes wrong:** Checking if a directory exists with `fs.existsSync` or `fs.access` then immediately trying to create it with `fs.mkdir`. Another process or user might create/delete the directory between the check and the action.
**Why it happens:** Non-atomic operations in a concurrent environment.
**How to avoid:** Attempt `fs.promises.mkdir(path, { recursive: true })` directly and handle errors, particularly `EEXIST` (if it's a file) or `EACCES`. Then, perform a separate `fs.promises.access(path, constants.W_OK)` to confirm writeability after the directory is confirmed to exist and be in the correct state.
**Warning signs:** Intermittent errors like "directory already exists" when it shouldn't, or "permission denied" when it appears to be writable.

### Pitfall 2: Insecure Path Handling
**What goes wrong:** Directly using user-provided paths without normalization or validation, potentially leading to directory traversal vulnerabilities or unexpected file system interactions.
**Why it happens:** Lack of path sanitization.
**How to avoid:** Always use `path.resolve()` to get an absolute path, which resolves `.` and `..` segments. While `path.resolve` handles normalization, ensure the resulting path doesn't point outside an intended root if there were more complex scenarios (not strictly needed for this phase but good practice).
**Warning signs:** Unintended file writes or reads in unexpected locations.

### Pitfall 3: Not Handling Permission Denials Explicitly
**What goes wrong:** Failing to catch and provide user-friendly error messages for `EACCES` (permission denied) errors during file system operations.
**Why it happens:** Generic error handling or oversight.
**How to avoid:** Use `try...catch` blocks around `fs.promises` calls and specifically check `error.code` for `EACCES` to provide a clear, actionable message to the user.
**Warning signs:** CLI crashes or generic "operation failed" messages when permission issues are the root cause.

## Code Examples

Verified patterns from official sources:

### CLI Entry Point with Commander.js
```javascript
// Source: https://commanderjs.com/
#!/usr/bin/env node
const { Command } = require('commander');
const path = require('path');
const fs = require('fs').promises; // Import fs.promises
const { constants } = require('fs'); // Import constants

const program = new Command();

async function validateAndPrepareOutputDir(dirPath) {
  const absolutePath = path.resolve(dirPath);
  try {
    await fs.mkdir(absolutePath, { recursive: true });
    await fs.access(absolutePath, constants.W_OK);
    return absolutePath;
  } catch (error) {
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: Cannot write to '${absolutePath}'. Please check folder permissions.`);
    }
    if (error.code === 'EEXIST' && (await fs.stat(absolutePath)).isFile()) {
        throw new Error(`Path '${absolutePath}' exists but is a file, not a directory. Please provide a directory path.`);
    }
    throw new Error(`Failed to access or create output directory '${absolutePath}': ${error.message}`);
  }
}

program
  .name('kline-fetcher')
  .description('CLI to fetch kline data from Binance Vision')
  .version('0.0.1');

program.command('fetch')
  .description('Fetch kline data for a symbol (Future phases will add more options)')
  .option('-o, --output-dir <path>', 'Specify the output directory for data storage', './data')
  .action(async (options) => {
    try {
      console.log('Validating output directory...');
      const outputDir = await validateAndPrepareOutputDir(options.outputDir);
      console.log(`Using output directory: ${outputDir}`);
      // Future: Initiate data fetching process here
      console.log('CLI initialized successfully with validated output directory.');
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1); // Exit with a non-zero code on error
    }
  });

program.parse(process.argv);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `process.argv` parsing for CLI | Dedicated CLI frameworks (e.g., Commander.js, Yargs) | ~2010s | Simplifies CLI development, provides consistent user experience, and reduces error surface. |
| Synchronous `fs` operations | Asynchronous `fs.promises` API | Node.js v10 (2018) for `fs.promises` | Improves performance by not blocking the event loop, crucial for responsive applications, especially CLIs. |

**Deprecated/outdated:**
-   `fs.exists(path, callback)`: Deprecated in Node.js, replaced by `fs.access`.
-   Directly using `fs.stat(path, callback)` for existence checks: While not strictly deprecated, `fs.promises.access` is often more direct for permission checks.

## Open Questions

1.  **Error Reporting Detail**
    -   What we know: We can catch `EACCES`, `EEXIST`, `ENOENT` specifically.
    -   What's unclear: How verbose should error messages be? Should we suggest `sudo` or `chmod` for permission issues, or just state the problem?
    -   Recommendation: For now, provide clear problem statements. Avoid suggesting specific commands like `sudo` as it implies system-level changes that might be outside the tool's scope or unsafe for the user without further context.

## Sources

### Primary (HIGH confidence)
-   commanderjs.com - Official documentation for Commander.js
-   https://nodejs.org/api/fs.html - Node.js v25.7.0 Documentation for File system module (`fs.promises`, `fs.constants`)

### Secondary (MEDIUM confidence)
-   Web search results for "best nodejs cli framework 2024" - Informed the choice of Commander.js by comparing popular options.

## Metadata

**Confidence breakdown:**
-   Standard stack: HIGH - Based on official documentation and widespread community adoption for Node.js CLI tools.
-   Architecture: HIGH - Directly follows best practices for Node.js asynchronous programming and Commander.js usage.
-   Pitfalls: HIGH - Common issues well-documented in Node.js development, with clear prevention strategies.

**Research date:** 2024-07-30
**Valid until:** 2025-01-30 (6 months, as Node.js and CLI frameworks are relatively stable in core features)
