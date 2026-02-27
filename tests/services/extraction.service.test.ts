import extract from 'extract-zip';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { ExtractionService } from '../../src/services/extraction.service';

// Mocking node:fs/promises
jest.mock('node:fs/promises', () => {
  const actual = jest.requireActual('node:fs/promises');
  return {
    __esModule: true,
    ...actual,
    unlink: jest.fn(),
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdtemp: jest.fn(),
    rm: jest.fn(),
  };
});

const mockedFs = fs as jest.Mocked<typeof fs>;

// Mocking extract-zip
jest.mock('extract-zip');
const mockedExtract = extract as unknown as jest.Mock;

describe('ExtractionService', () => {
  const mockZipPath = '/mock/path/to/BTCUSDT-1m-2021-01.zip';
  const mockDestDir = '/mock/path/to/dest';
  const mockCsvPath = '/mock/path/to/dest/BTCUSDT-1m-2021-01.csv';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unit Tests', () => {
    beforeEach(() => {
      mockedFs.unlink.mockImplementation(async () => {});
      mockedFs.access.mockImplementation(async () => {});
    });

    test('should successfully extract and cleanup ZIP', async () => {
      mockedFs.access.mockRejectedValue(new Error('ENOENT')); // CSV missing
      mockedExtract.mockResolvedValue(undefined);

      await ExtractionService.extractAndCleanup(mockZipPath, mockDestDir);

      expect(mockedExtract).toHaveBeenCalledWith(mockZipPath, { dir: mockDestDir });
      expect(mockedFs.unlink).toHaveBeenCalledWith(mockZipPath);
    });

    test('should skip extraction if CSV already exists (idempotency)', async () => {
      mockedFs.access.mockResolvedValue(undefined); // CSV exists

      await ExtractionService.extractAndCleanup(mockZipPath, mockDestDir);

      expect(mockedExtract).not.toHaveBeenCalled();
      expect(mockedFs.unlink).toHaveBeenCalledWith(mockZipPath);
    });

    test('should cleanup partial CSV file and delete corrupted ZIP on corruption failure', async () => {
      const extractionError = new Error('invalid signature');
      mockedExtract.mockRejectedValue(extractionError);
      // First call (idempotency check) returns Error (CSV missing)
      mockedFs.access.mockReset();
      mockedFs.access.mockRejectedValue(new Error('ENOENT'));
      mockedFs.unlink.mockReset();
      mockedFs.unlink.mockResolvedValue(undefined);

      await expect(ExtractionService.extractAndCleanup(mockZipPath, mockDestDir))
        .rejects.toThrow(`Corrupted archive detected: ${path.basename(mockZipPath)}. The file has been deleted. Please re-run the command with --force to re-download.`);

      // Should attempt to unlink partial CSV (even if it fails) and the corrupted ZIP
      expect(mockedFs.unlink).toHaveBeenCalledWith(mockCsvPath);
      expect(mockedFs.unlink).toHaveBeenCalledWith(mockZipPath);
    });

    test('should not throw if partial CSV file does not exist on extraction failure', async () => {
      const extractionError = new Error('Extraction failed');
      mockedExtract.mockRejectedValue(extractionError);
      mockedFs.access.mockRejectedValue(new Error('ENOENT')); // File missing
      mockedFs.unlink.mockReset();
      mockedFs.unlink.mockRejectedValue(new Error('ENOENT')); // Unlink CSV fails

      await expect(ExtractionService.extractAndCleanup(mockZipPath, mockDestDir))
        .rejects.toThrow(`Extraction failed for ${mockZipPath}: ${extractionError.message}`);

      expect(mockedFs.unlink).toHaveBeenCalledWith(mockCsvPath);
    });
  });

  describe('Integration Tests', () => {
    let testTmpDir: string;
    const actualFs = jest.requireActual('node:fs/promises');

    beforeEach(async () => {
      // Restore the real implementation for integration tests
      mockedExtract.mockImplementation(jest.requireActual('extract-zip') as any);
      
      mockedFs.unlink.mockImplementation(actualFs.unlink);
      mockedFs.access.mockImplementation(actualFs.access);
      mockedFs.readFile.mockImplementation(actualFs.readFile);
      mockedFs.writeFile.mockImplementation(actualFs.writeFile);
      mockedFs.mkdtemp.mockImplementation(actualFs.mkdtemp);
      mockedFs.rm.mockImplementation(actualFs.rm);

      testTmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'extraction-test-'));
    });

    afterEach(async () => {
      await actualFs.rm(testTmpDir, { recursive: true, force: true });
    });

    test('Integration: Success - extract ZIP and cleanup source', async () => {
      const csvName = 'test-file.csv';
      const zipName = 'test-file.zip';
      const csvPath = path.join(testTmpDir, csvName);
      const zipPath = path.join(testTmpDir, zipName);
      const content = 'time,price\n1,100\n2,200';

      // 1. Create a dummy CSV file
      await fs.writeFile(csvPath, content);

      // 2. Create a ZIP file using the 'zip' shell command
      execSync(`zip -j "${zipPath}" "${csvPath}"`, { stdio: 'ignore' });

      // 3. Remove the original CSV so we can verify it's extracted
      await fs.unlink(csvPath);

      // 4. Extract and cleanup
      await ExtractionService.extractAndCleanup(zipPath, testTmpDir);

      // 5. Verify results
      const extractedContent = await fs.readFile(csvPath, 'utf8');
      expect(extractedContent).toBe(content);

      // 6. Verify source ZIP is gone
      await expect(fs.access(zipPath)).rejects.toThrow();
    });

    test('Integration: Idempotency - skip ZIP extraction if CSV exists', async () => {
      const csvName = 'test-file.csv';
      const zipName = 'test-file.zip';
      const csvPath = path.join(testTmpDir, csvName);
      const zipPath = path.join(testTmpDir, zipName);
      const content = 'time,price\n1,100\n2,200';

      // 1. Create a dummy CSV file
      await fs.writeFile(csvPath, content);

      // 2. Create a dummy ZIP file (doesn't even have to be a real zip if we're skipping extraction)
      await fs.writeFile(zipPath, 'dummy zip');

      // 3. Extract and cleanup
      await ExtractionService.extractAndCleanup(zipPath, testTmpDir);

      // 4. Verify CSV still exists and ZIP is gone
      const extractedContent = await fs.readFile(csvPath, 'utf8');
      expect(extractedContent).toBe(content);
      await expect(fs.access(zipPath)).rejects.toThrow();
    });

    test('Integration: Failure - rollback partial files and delete corrupted ZIP', async () => {
      const zipName = 'corrupted.zip';
      const zipPath = path.join(testTmpDir, zipName);
      const csvPath = path.join(testTmpDir, 'corrupted.csv');

      // 1. Create a corrupted ZIP file
      await fs.writeFile(zipPath, 'not a zip content');

      // 2. Extract and expect failure
      await expect(ExtractionService.extractAndCleanup(zipPath, testTmpDir))
        .rejects.toThrow('Corrupted archive detected');

      // 3. Verify no partial files exist
      await expect(fs.access(csvPath)).rejects.toThrow();

      // 4. Verify corrupted ZIP is ALSO deleted
      await expect(fs.access(zipPath)).rejects.toThrow();
    });
  });
});
