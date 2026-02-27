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

    try {
      // 1. Perform extraction
      await extract(zipPath, { dir: destDir });

      // 2. Cleanup: delete the source .zip file after successful extraction
      await fs.unlink(zipPath);
    } catch (error) {
      // 3. Rollback: cleanup partial extraction if failure occurs
      try {
        await fs.access(expectedCsvPath);
        // If access doesn't throw, the file (likely partially extracted) exists
        await fs.unlink(expectedCsvPath);
      } catch (accessError) {
        // If fs.access fails, file doesn't exist, no cleanup needed
      }

      // Re-throw original error with additional context
      throw new Error(`Extraction failed for ${zipPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
