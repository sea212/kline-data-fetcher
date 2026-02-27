import fetch from 'node-fetch';
import { pipeline } from 'node:stream/promises';
import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';

export class DownloadService {
  /**
   * Downloads a file from a given URL to a specified destination path.
   * Supports retries with exponential backoff and resuming partial downloads.
   * @param url The URL of the file to download.
   * @param destPath The absolute path where the file should be saved.
   * @param maxRetries Maximum number of retry attempts for transient errors.
   * @param retryDelay Initial delay for retries in milliseconds.
   * @throws {Error} If the download fails after all retry attempts.
   */
  public static async downloadFile(url: string, destPath: string, maxRetries = 3, retryDelay = 1000): Promise<void> {
    if (!url || !destPath) {
      throw new Error('URL and destination path are required.');
    }

    const destDir = path.dirname(destPath);
    await fsPromises.mkdir(destDir, { recursive: true });

    let attempt = 0;
    while (attempt <= maxRetries) {
      let fileStream: fs.WriteStream | null = null;
      try {
        const existingStat = await fsPromises.stat(destPath).catch(() => null);
        const existingSize = existingStat ? existingStat.size : 0;

        const headers: Record<string, string> = {};
        if (existingSize > 0) {
          headers['Range'] = `bytes=${existingSize}-`;
        }

        const response = await fetch(url, { method: 'GET', headers });

        if (response.status === 416) {
          // Range Not Satisfiable - likely file is already fully downloaded
          console.log(`Range not satisfiable for ${url}. File might be complete at ${destPath}.`);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
        }

        if (!response.body) {
          throw new Error(`No response body received for URL: ${url}`);
        }

        const isPartial = response.status === 206;
        fileStream = fs.createWriteStream(destPath, { flags: isPartial ? 'a' : 'w' });

        await pipeline(response.body, fileStream);
        console.log(`Successfully downloaded ${url} to ${destPath}`);
        return;

      } catch (error) {
        // Ensure stream is closed
        if (fileStream && !fileStream.closed) {
          fileStream.close();
        }

        attempt++;
        if (attempt > maxRetries) {
          throw new Error(`Failed to download ${url} after ${maxRetries} retries. ${error instanceof Error ? error.message : String(error)}`);
        }

        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.warn(`Download failed for ${url}. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries}). Error: ${error instanceof Error ? error.message : String(error)}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
