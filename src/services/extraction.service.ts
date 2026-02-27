import extract from 'extract-zip';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export class ExtractionService {
  /**
   * Extracts a ZIP file to a target directory and deletes the source ZIP file upon success.
   * If extraction fails, it cleans up any partially extracted CSV file.
   *
   * @param zipPath The absolute path to the .zip archive.
   * @param destDir The absolute path to the destination directory.
   */
  static async extractAndCleanup(zipPath: string, destDir: string): Promise<void> {
    const zipBasename = path.basename(zipPath, '.zip');
    const expectedCsvPath = path.join(destDir, `${zipBasename}.csv`);

    // Idempotency check: if CSV already exists, skip extraction and just cleanup ZIP
    try {
      await fs.access(expectedCsvPath);
      // If we reach here, CSV already exists.
      // We can safely delete the ZIP and return to avoid redundant extraction.
      await fs.unlink(zipPath);
      return;
    } catch (error) {
      // CSV does not exist, proceed with extraction
    }

    try {
      // 1. Perform extraction
      await extract(zipPath, { dir: destDir });

      // 2. Cleanup: delete the source .zip file after successful extraction
      await fs.unlink(zipPath);
    } catch (error) {
      // 3. Rollback: cleanup partial extraction if failure occurs
      try {
        await fs.unlink(expectedCsvPath);
      } catch (accessError) {
        // If fs.unlink fails, file likely doesn't exist, no cleanup needed
      }

      // 4. Handle corruption specifically
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCorrupted = errorMessage.includes('invalid signature') || 
                          errorMessage.includes('end of central directory record') ||
                          errorMessage.includes('compressed size mismatch') ||
                          errorMessage.includes('invalid entry');

      if (isCorrupted) {
        try {
          // Delete the corrupted ZIP so it can be re-downloaded next time
          await fs.unlink(zipPath);
        } catch (unlinkError) {
          // Ignore unlink errors for the ZIP
        }
        throw new Error(`Corrupted archive detected: ${path.basename(zipPath)}. The file has been deleted. Please re-run the command with --force to re-download.`);
      }

      // Re-throw original error with additional context
      throw new Error(`Extraction failed for ${zipPath}: ${errorMessage}`);
    }
  }
}
