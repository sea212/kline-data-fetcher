# Phase 4: Data Extraction & Finalization - Research

**Researched:** 2026-02-27
**Domain:** Node.js Zip Extraction & File Management
**Confidence:** HIGH

## Summary
This phase involves extracting CSV files from the downloaded `.zip` archives and placing them in their final destination directory while cleaning up the temporary files.

## Extraction Library Comparison

| Library | Popularity | Pros | Cons |
|---------|------------|------|------|
| `adm-zip` | Very High | Simple API, synchronous (easier for sequential flows), extracts to memory or disk. | Sync operations can block the event loop (though usually fine for CLI). |
| `extract-zip` | High | Built on `yauzl` (very robust), promise-based, handles large archives well. | Async only. |
| `unzipper` | Moderate | Streaming-friendly, flexible. | Can be overkill for simple one-file extraction. |

**Recommendation:** `extract-zip` is a solid choice because it's built on `yauzl`, which is the industry standard for robustness in Node.js zip handling. It provides a simple `extract(source, { dir: target })` API.

## Binance Vision ZIP Structure
Research indicates that Binance Vision `.zip` files for kline data typically contain a single `.csv` file with the same base name as the zip file.
Example: `BTCUSDT-1m-2017-08.zip` contains `BTCUSDT-1m-2017-08.csv`.

## Final Directory Structure
As per Phase 3 research:
```
<user_data_path>/
├── BTCUSDT/
│   ├── .tmp/          # Temporary storage for zip files
│   └── BTCUSDT-1m-2017-08.csv  # Final location
```

## Cleanup Strategy
1.  Download `.zip` to `.tmp/`.
2.  Extract `.csv` from `.zip` to `symbolDir` (parent of `.tmp/`).
3.  Verify the `.csv` exists in the destination.
4.  Unlink (delete) the `.zip` file from `.tmp/`.

## Architecture Patterns

### Service: `ExtractionService`
```typescript
import extract from 'extract-zip';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';

export class ExtractionService {
  public static async extractAndCleanup(zipPath: string, destDir: string): Promise<string> {
    await extract(zipPath, { dir: destDir });
    // After extraction, we might want to verify the file or rename it if needed.
    // For Binance, the name matches, so it should be fine.
    await fsPromises.unlink(zipPath);
    return "Extracted successfully";
  }
}
```

## Common Pitfalls
- **Zip-slip vulnerability**: Using a library that doesn't sanitize paths in the ZIP. `extract-zip` (via `yauzl`) handles this.
- **Incomplete Extraction**: If extraction fails halfway, we should ensure the target file is cleaned up.

## Validation Architecture
- **Framework:** Jest.
- **Test Strategy:** Use a small real zip file (or create one in the test) and verify it's extracted and the source is deleted.

## Sources
- [extract-zip documentation](https://www.npmjs.com/package/extract-zip)
- [yauzl documentation](https://www.npmjs.com/package/yauzl)
