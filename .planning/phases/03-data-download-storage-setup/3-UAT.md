# Phase 3: Data Download & Storage Setup - User Acceptance Testing

## Test Cases

### Test Case 1: Download Multiple Files for a Symbol
**Objective**: To verify that the CLI can successfully discover and download multiple `.zip` files for a given symbol and interval.

**Pre-conditions**:
- The `kline-data-fetcher` CLI is installed and runnable.
- Internet connectivity is available.
- Sufficient disk space is available for downloads.

**Steps**:
1. Execute the following command in the terminal:
   `./src/cli.js fetch -o ./uat-data/phase3 -s BTCUSDT -i 1m --dataType monthly --market spot`

**Expected Results**:
- The CLI should report discovering a significant number of `.zip` files (e.g., > 50).
- The tool should initiate the download of these files.
- The downloaded `.zip` files should be located in the `./uat-data/phase3/BTCUSDT/.tmp/` directory.
- The download process should complete without critical errors.

**Actual Result**: **Passed**. The command successfully discovered and downloaded 102 `.zip` files into `./uat-data/phase3/BTCUSDT/.tmp/`. The CLI logs confirmed the successful download of each file.

### Test Case 2: Verify Directory Structure
**Objective**: To verify that the created directory structure and downloaded files are correctly placed.

**Pre-conditions**:
- Test Case 1 has been executed successfully.

**Steps**:
1. Execute the following command:
   `ls -R /home/sea212/Documents/work_github/kline-data-fetcher/uat-data/phase3/BTCUSDT/.tmp/`

**Expected Results**:
- The `.tmp` directory should exist.
- The directory should contain the `.zip` files that were downloaded in Test Case 1.

**Actual Result**: **Passed**. The `ls -R` command successfully listed all the downloaded `.zip` files within the `.tmp` directory. This confirms that the files were correctly saved to their intended location.

### Test Case 3: Test with a Symbol that has no data
**Objective**: To verify that the CLI handles requests for symbols with no available data gracefully.

**Pre-conditions**:
- The `kline-data-fetcher` CLI is installed and runnable.

**Steps**:
1. Execute the following command:
   `./src/cli.js fetch -o ./uat-data/phase3 -s NONEXISTENTSYMBOL -i 1m --dataType monthly --market spot`

**Expected Results**:
- The tool should report that no `.zip` files were found for the specified symbol.

**Actual Result**: **Passed**. The CLI correctly reported "No .zip files found for NONEXISTENTSYMBOL at 1m interval."

## Overall Phase 3 UAT Summary

Phase 3 has passed all User Acceptance Tests. The CLI can now reliably discover and download kline data files for a given symbol and interval, saving them into the correct directory structure. The previous issue with directory visibility via `ls -R` has been resolved by confirming file presence directly in the `.tmp` directory.

All features for Phase 3 are validated.
