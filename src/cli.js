#!/usr/bin/env node

require('ts-node/register');

const { Command } = require('commander');
const { validateAndPrepareOutputDir } = require('./utils/fs-utils.js');
const { getKlineZipFileUrls } = require('./data-source/binance-vision.service'); // Import discovery service
const { DownloadService } = require('./services/download.service'); // Import DownloadService
const path = require('path'); // Import path module
const fs = require('fs'); // Import fs for path manipulation (though fs/promises is used in service)

const program = new Command();

program
  .name('kline-fetcher')
  .description('CLI for fetching kline data')
  .version('0.0.1');

program
  .command('fetch')
  .description('Fetches kline data')
  .option('-o, --output-dir <path>', 'Specify the base output directory for data storage', './data')
  .requiredOption('-s, --symbol <symbol>', 'Specify the trading symbol (e.g., BTCUSDT)')
  .option('-i, --interval <interval>', 'Specify the kline interval (e.g., 1m, 1h)', '1m')
  .option('--market <market>', 'Specify the market type (spot, futures/um, futures/cm)', 'spot')
  .option('--dataType <dataType>', 'Specify the data type (monthly, daily)', 'monthly')
  .action(async (options) => { // Make action async
    try {
      const validatedOutputDir = await validateAndPrepareOutputDir(options.outputDir);
      console.log(`Output Directory: ${validatedOutputDir} (Validated and Ready)`);

      const discoveryOptions = {
        symbol: options.symbol,
        interval: options.interval,
        market: options.market,
        dataType: options.dataType,
      };

      console.log(`Discovering kline zip files for ${options.symbol} at ${options.interval} interval...`);
      const zipUrls = await getKlineZipFileUrls(discoveryOptions);

      if (zipUrls.length === 0) {
        console.log(`No .zip files found for ${options.symbol} at ${options.interval} interval.`);
        return;
      }

      console.log(`Found ${zipUrls.length} .zip files. Starting download...`);

      const symbolDir = path.join(validatedOutputDir, options.symbol.toUpperCase());
      const tempDir = path.join(symbolDir, '.tmp');
      await mkdir(tempDir, { recursive: true }); // Ensure temporary directory exists

      // Download files sequentially
      for (const url of zipUrls) {
        const fileName = path.basename(url);
        const destPath = path.join(tempDir, fileName);
        console.log(`Downloading ${fileName} to ${destPath}...`);
        try {
          await DownloadService.downloadFile(url, destPath);
          console.log(`Successfully downloaded ${fileName}.`);
        } catch (error) {
          console.error(`Failed to download ${fileName}:`, error.message);
          // Cleanup is handled within DownloadService.downloadFile on error
        }
      }
      console.log('Download process finished.');
    } catch (error) {
      console.error('CLI Error:', error.message);
      process.exit(1); // Exit with a non-zero status code on error
    }
  });

program.parse(process.argv);

