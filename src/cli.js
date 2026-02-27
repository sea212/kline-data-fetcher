#!/usr/bin/env node

require('ts-node/register');

const { Command } = require('commander');
const { validateAndPrepareOutputDir } = require('./utils/fs-utils.js');
const { getKlineZipFileUrls } = require('./data-source/binance-vision.service'); // Import discovery service
const { DownloadService } = require('./services/download.service'); // Import DownloadService
const { ExtractionService } = require('./services/extraction.service'); // Import ExtractionService
const path = require('path'); // Import path module
const { mkdir } = require('fs').promises; // Import mkdir from fs.promises
const fs = require('fs'); // Import fs for path manipulation (though fs/promises is used in service)
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');

const { formatErrorMessage } = require('./utils/error-handler');

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
  .option('-c, --concurrency <number>', 'Specify the number of concurrent downloads', (val) => parseInt(val, 10), 5)
  .option('-f, --force', 'Force download even if CSV already exists', false)
  .action(async (options) => { // Make action async
    try {
      // 1. Input Validation
      const symbol = options.symbol.toUpperCase();
      if (!/^[A-Z0-9]{3,}$/.test(symbol)) {
        throw new Error(`Invalid symbol format: ${options.symbol}. Expected alphanumeric string of at least 3 characters (e.g., BTCUSDT).`);
      }

      const allowedIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
      if (!allowedIntervals.includes(options.interval)) {
        throw new Error(`Invalid interval: ${options.interval}. Allowed values: ${allowedIntervals.join(', ')}`);
      }

      const validatedOutputDir = await validateAndPrepareOutputDir(options.outputDir);
      console.log(`Output Directory: ${validatedOutputDir} (Validated and Ready)`);

      const discoveryOptions = {
        symbol: symbol,
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

      console.log(`Found ${zipUrls.length} .zip files. Starting process...`);

      const symbolDir = path.join(validatedOutputDir, options.symbol.toUpperCase());
      const tempDir = path.join(symbolDir, '.tmp');
      await mkdir(tempDir, { recursive: true }); // Ensure temporary directory exists

      const progressBar = new cliProgress.SingleBar({
        format: 'Progress |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total} Files | {status}',
        hideCursor: true
      }, cliProgress.Presets.shades_classic);

      progressBar.start(zipUrls.length, 0, { status: 'Initializing' });

      const limit = pLimit(options.concurrency);
      const stats = { success: 0, failed: 0, skipped: 0 };
      const failedFiles = [];

      const tasks = zipUrls.map((url) => limit(async () => {
        const fileName = path.basename(url);
        const csvName = fileName.replace('.zip', '.csv');
        const csvPath = path.join(symbolDir, csvName);
        const destPath = path.join(tempDir, fileName);

        // Skip logic (idempotency)
        if (!options.force && fs.existsSync(csvPath)) {
          stats.skipped++;
          progressBar.increment(1, { status: chalk.yellow(`Skipped ${fileName}`) });
          return;
        }

        try {
          // Note: DownloadService doesn't currently provide granular progress, 
          // so we update the status message.
          progressBar.update(progressBar.value, { status: chalk.blue(`Downloading ${fileName}`) });
          await DownloadService.downloadFile(url, destPath);

          progressBar.update(progressBar.value, { status: chalk.magenta(`Extracting ${fileName}`) });
          await ExtractionService.extractAndCleanup(destPath, symbolDir);

          stats.success++;
          progressBar.increment(1, { status: chalk.green(`Finished ${fileName}`) });
        } catch (error) {
          stats.failed++;
          failedFiles.push({ name: fileName, error: formatErrorMessage(error) });
          progressBar.increment(1, { status: chalk.red(`Failed ${fileName}`) });
        }
      }));

      await Promise.all(tasks);
      progressBar.stop();

      console.log('\n' + chalk.bold('Fetch Summary:'));
      console.log(chalk.green(`  Success: ${stats.success}`));
      console.log(chalk.yellow(`  Skipped: ${stats.skipped}`));
      console.log(chalk.red(`  Failed:  ${stats.failed}`));
      
      if (stats.failed > 0) {
        console.log(chalk.red('\nFailed Files:'));
        failedFiles.forEach(f => {
          console.log(chalk.red(`  - ${f.name}: ${f.error}`));
        });
      }
    } catch (error) {
      console.error(chalk.red('\nCLI Error:'), formatErrorMessage(error));
      process.exit(1); // Exit with a non-zero status code on error
    }
  });

program.parse(process.argv);

