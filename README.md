# Kline Data Fetcher

A high-performance CLI tool for fetching historical kline data from `binance.vision`.

## Features

- **Reliable Downloads**: Automatic retries with exponential backoff and resume support for interrupted downloads.
- **Concurrent Processing**: Parallel download and extraction for maximum speed (configurable concurrency).
- **Progress Tracking**: Real-time progress bars for each file being processed.
- **Smart Idempotency**: Automatically skips files that have already been successfully downloaded and extracted.
- **Robust Error Handling**: Handles network issues, corrupted archives, and invalid inputs with human-friendly error messages.

## Installation

```bash
npm install
```

## Usage

```bash
node src/cli.js fetch --symbol <symbol> [options]
```

### Options

- `-s, --symbol <symbol>`: (Required) Trading symbol (e.g., BTCUSDT).
- `-o, --output-dir <path>`: Base output directory (default: `./data`).
- `-i, --interval <interval>`: Kline interval (e.g., 1m, 1h, 1d) (default: `1m`).
- `-c, --concurrency <number>`: Number of concurrent downloads (default: `5`).
- `-f, --force`: Force download and extraction even if the target CSV already exists.
- `--market <market>`: Market type (spot, futures/um, futures/cm) (default: `spot`).
- `--dataType <dataType>`: Data type (monthly, daily) (default: `monthly`).

### Example

```bash
node src/cli.js fetch --symbol BTCUSDT --interval 1m --concurrency 10
```

## Reliability and Performance

- **Retries**: Transient network errors are automatically retried.
- **Resumption**: If a download is interrupted, it will resume from where it left off using `Range` HTTP headers.
- **Parallelism**: Uses `p-limit` to process multiple files simultaneously without overwhelming the system.
- **Cleanup**: Temporary files are automatically cleaned up after successful extraction. Corrupted archives are detected and removed.
