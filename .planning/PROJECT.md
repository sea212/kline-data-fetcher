# Project: Kline Data Fetcher

## Core Idea
A high-performance, reliable CLI tool to download and extract historical kline data from `binance.vision`.

## Current State (v1.0 Shipped 2026-02-27)
- [x] **Discovery**: Automated URL discovery and filtering for Binance kline data.
- [x] **Download**: Streaming downloads with exponential backoff and resume support.
- [x] **Extraction**: Concurrent ZIP extraction with automatic cleanup and rollback on failure.
- [x] **CLI**: User-friendly interface with progress feedback and summary reports.

## Next Milestone Goals
- [ ] Support for checksum validation.
- [ ] Explicit handling of daily data types.
- [ ] Export to other formats (e.g., Parquet, SQL).
- [ ] Market analysis hooks.

<details>
<summary>Archived Vision (v1.0)</summary>

The process involves:
1.  Accessing the `binance.vision` website (e.g., `https://data.binance.vision/?prefix=data/spot/monthly/klines/`).
2.  Identifying URLs for specific symbols and kline intervals (e.g., `https://data.binance.vision/?prefix=data/spot/monthly/klines/BTCUSDT/1m/`).
3.  Scanning these URLs for links to `.zip` files, explicitly avoiding `.zip.CHECKSUM` files.
4.  Downloading the identified `.zip` files (e.g., `https://data.binance.vision/data/spot/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2026-01.zip`).
5.  Extracting the contents of the `.zip` files and storing them as CSV files in the designated folder (e.g., `<data_path>/BTCUSDT/BTCUSDT-1m-2026-01.csv`).
</details>
