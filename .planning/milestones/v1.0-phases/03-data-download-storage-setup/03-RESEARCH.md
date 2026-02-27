# Phase 3: Data Download & Storage Setup - Research

**Researched:** 2025-01-24
**Domain:** Node.js File System & Streaming Downloads
**Confidence:** HIGH

## Summary
This phase involves downloading historical kline `.zip` files from `binance.vision` using `node-fetch`, streaming them directly to the local file system to minimize memory usage, and ensuring the target directory structure exists. Key focus areas include robust stream handling using `pipeline` and recursive directory management.

**Primary recommendation:** Use `pipeline` from `node:stream/promises` to connect the `node-fetch` response body to a `fs.WriteStream`, ensuring automatic cleanup and error propagation.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DDSS-01 | For each identified .zip URL, the tool successfully downloads the file to a temporary location. | Standard Stack, Architecture Patterns |
| DDSS-02 | The tool creates the `<user_data_path>/<SYMBOL>/` directory structure recursively. | Standard Stack, Architecture Patterns |
| DDSS-03 | Downloaded .zip files are stored in a temporary, organized manner ready for extraction. | Architecture Patterns |

## Standard Stack

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node-fetch` | ^3.3.2 | HTTP client | Standard for fetch-like API in Node.js. |
| `node:stream/promises` | Built-in | Stream utilities | `pipeline` is the safest way to pipe streams in Node.js. |
| `node:fs` | Built-in | File system streams | For `createWriteStream`. |
| `node:fs/promises` | Built-in | File system API | Modern, promise-based file operations. |
| `node:path` | Built-in | Path manipulation | Cross-platform path joining. |

## Architecture Patterns

### Recommended Project Structure
The files should be downloaded to a temporary location before being processed/extracted (extraction is Phase 4).
```
<user_data_path>/
├── BTCUSDT/
│   ├── .tmp/          # Temporary storage for active downloads
│   └── BTCUSDT-1m-2024-01.csv (extracted in Phase 4)
```

### Pattern: Streaming Download with Pipeline
```typescript
import fetch from 'node-fetch';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

async function downloadFile(url: string, destPath: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);

    await mkdir(path.dirname(destPath), { recursive: true });
    const fileStream = createWriteStream(destPath);
    
    // pipeline handles closing streams and error propagation
    await pipeline(response.body, fileStream);
}
```

### Pattern: Recursive Directory Creation
Always use `{ recursive: true }` with `fs.mkdir` to ensure nested structures like `<user_path>/<SYMBOL>/` are created in one call.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stream Piping | `.pipe()` | `pipeline()` | `.pipe()` doesn't handle all error scenarios or close all streams on failure. |
| URL Path Joining | String concatenation | `path.join()` | Handles cross-platform separator differences. |

## Common Pitfalls

### Pitfall 1: Memory Bloat
**What goes wrong:** Using `response.arrayBuffer()` or `response.text()` for large files.
**How to avoid:** Always use `response.body` (stream) for file downloads.

### Pitfall 2: Race Conditions in Directory Creation
**What goes wrong:** Checking `fs.exists` before `mkdir`.
**How to avoid:** Call `mkdir(..., { recursive: true })` directly; it handles existing directories gracefully.

## Code Examples

### Handling Download Progress (Optional/Future)
```typescript
const response = await fetch(url);
const totalSize = parseInt(response.headers.get('content-length') || '0', 10);
let downloaded = 0;

if (response.body) {
  response.body.on('data', (chunk) => {
      downloaded += chunk.length;
      const progress = ((downloaded / totalSize) * 100).toFixed(2);
      // Update CLI progress bar here
  });
}
```

## Validation Architecture
- **Framework:** Jest (already in project).
- **Test Strategy:** Mock `node-fetch` response with a readable stream and verify `fs.createWriteStream` interaction.

### Sources
- [node-fetch documentation](https://www.npmjs.com/package/node-fetch) (HIGH)
- [Node.js Stream documentation](https://nodejs.org/api/stream.html#streampipelinestreams-callback) (HIGH)
- [Node.js FS documentation](https://nodejs.org/api/fs.html#fspromisesmkdirpath-options) (HIGH)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: HIGH

**Research date:** 2025-01-24
**Valid until:** 2025-07-24
