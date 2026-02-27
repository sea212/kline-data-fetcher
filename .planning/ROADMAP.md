## Phases

- [x] **Phase 1: Project Initialization & Basic CLI** - Establish project structure and a basic command-line interface.
- [x] **Phase 2: Data Source Interaction & Discovery** - Enable the tool to connect to binance.vision and discover relevant data URLs.
- [ ] **Phase 3: Data Download & Storage Setup** - Implement functionality to download identified .zip files and set up the directory structure.
- [ ] **Phase 4: Data Extraction & Finalization** - Extract CSV contents from downloaded .zip files and store them in final structured locations.
- [ ] **Phase 5: Reliability, Performance & Error Handling** - Enhance the tool with robust error handling, reliability, and performance features.

## Phase Details

### Phase 1: Project Initialization & Basic CLI
**Goal**: Users can initiate the tool with a specified output directory via a functional command-line interface.
**Depends on**: Nothing
**Requirements**: FR2, NFR3
**Success Criteria** (what must be TRUE):
  1. User can execute the tool from the command line.
  2. User can specify a valid output directory path as a command-line argument.
  3. The tool validates the existence and write-permissions of the specified output directory.
**Plans**: 2 plans
- [x] 01-01-PLAN.md — Setup Basic CLI with Commander.js
- [x] 01-02-PLAN.md — Implement Output Directory Validation and Integration

### Phase 2: Data Source Interaction & Discovery
**Goal**: The tool can successfully identify and list all downloadable kline data `.zip` files for a given symbol and interval from `binance.vision`.
**Depends on**: Phase 1
**Requirements**: FR1, FR4
**Success Criteria** (what must be TRUE):
  1. Given a symbol (e.g., BTCUSDT) and interval (e.g., 1m), the tool can access the corresponding `binance.vision` URL.
  2. The tool can parse the HTML of the URL to find links to `.zip` files.
  3. The tool successfully filters out `.zip.CHECKSUM` links from the list of downloadable files.
  4. The tool can present a list of valid `.zip` file URLs to be downloaded.
**Plans**: 1 plan
- [x] 02-01-PLAN.md — Implement Binance Vision Kline Data Discovery Service

### Phase 3: Data Download & Storage Setup
**Goal**: The tool can download the identified `.zip` files and create the correct directory structure to prepare for data extraction.
**Depends on**: Phase 2
**Requirements**: FR3, FR5
**Success Criteria** (what must be TRUE):
  1. For each identified `.zip` URL, the tool successfully downloads the file to a temporary location.
  2. The tool creates the `<user_data_path>/<SYMBOL>/` directory structure for a given symbol if it doesn't exist.
  3. Downloaded `.zip` files are stored in a temporary, organized manner ready for extraction.
**Plans**: 1 plan
- [ ] 03-01-PLAN.md — Implement Download Service and CLI Integration

### Phase 4: Data Extraction & Finalization
**Goal**: The tool can extract the CSV contents from downloaded `.zip` files and store them as individual `.csv` files in their final structured locations.
**Depends on**: Phase 3
**Requirements**: FR6
**Success Criteria** (what must be TRUE):
  1. The tool can extract the contents of a downloaded `.zip` file.
  2. The extracted data is converted and saved as a `.csv` file (e.g., `BTCUSDT-1m-2026-01.csv`).
  3. The `.csv` file is placed in the correct final directory: `<user_data_path>/<SYMBOL>/<KLINECSV_DATA_FILES>`.
  4. The temporary `.zip` file is removed after successful extraction and storage.
**Plans**: TBD

### Phase 5: Reliability, Performance & Error Handling
**Goal**: The tool provides a robust, efficient, and user-friendly experience, handling various operational challenges gracefully.
**Depends on**: Phase 4
**Requirements**: NFR1, NFR2, NFR4, NFR3
**Success Criteria** (what must be TRUE):
  1. The tool can resume interrupted downloads or retry failed download attempts for `.zip` files.
  2. The tool provides clear, informative error messages for network failures, invalid paths, or corrupt zip files.
  3. The tool efficiently handles requests for large volumes of historical data without user-perceptible slowdowns.
  4. The CLI allows users to easily specify symbols and kline intervals as parameters, with helpful prompts or validation for invalid inputs.
**Plans**: TBD

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Initialization & Basic CLI | 2/2 | Completed | 2025-01-24 |
| 2. Data Source Interaction & Discovery | 1/1 | Completed | 2025-01-24 |
| 3. Data Download & Storage Setup | 0/1 | In Progress | - |
| 4. Data Extraction & Finalization | 0/0 | Not started | - |
| 5. Reliability, Performance & Error Handling | 0/0 | Not started | - |
