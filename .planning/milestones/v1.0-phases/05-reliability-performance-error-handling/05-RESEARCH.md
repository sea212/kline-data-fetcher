# Phase 05 Research: Reliability, Performance & Error Handling

## Objectives
- Investigate best practices for download retries and resume logic in Node.js.
- Determine the best way to implement concurrency control for multiple file downloads.
- Research CLI progress reporting libraries compatible with `commander.js`.
- Explore idempotency patterns for file-based data fetching.

## Research Findings

### 1. Download Retries and Resume Logic
- **Retries**: A manual loop with exponential backoff is a standard approach when using `node-fetch`.
- **Resume**: Requires `Range` header and `fs.createWriteStream({ flags: 'a' })`.
    - Check if `binance.vision` supports `Accept-Ranges`.
    - Implementation: `stat` file size, if > 0, set `Range: bytes=size-`.
- **Alternative**: `got` has built-in retry logic, but adding a new dependency should be justified. `node-fetch` is already present.

### 2. Concurrency Control
- `p-limit` is the industry standard for limiting concurrent promises.
- For 100+ files, sequential is slow, but unlimited parallel can be throttled by the server or exceed file descriptor limits.
- A default concurrency of 5-10 is usually safe.

### 3. Progress Reporting
- `cli-progress` is highly customizable and works well with `commander.js`.
- `multibar` support in `cli-progress` allows tracking multiple concurrent downloads.

### 4. Idempotency & Performance
- Check if `<destDir>/<fileName>.csv` exists before downloading the `.zip`.
- If it exists, skip.
- Add `--force` flag to `cli.js` to bypass this check.
- Error handling for corrupt ZIPs: `extract-zip` throws on invalid archives. We should catch this and offer to re-download.

## Proposed Tech Stack Additions
- `p-limit`: For concurrency.
- `cli-progress`: For UX.
- `retry`: (Optional) or manual implementation.

## Verification Strategy
- **Unit Tests**: Mock network failures to test retries.
- **Integration Tests**: Simulate interrupted downloads to test resume.
- **UAT**: Run against a real symbol (e.g., BTCUSDT) for multiple months and verify speed and reliability.
