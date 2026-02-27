#!/usr/bin/env node

const { Command } = require('commander');
const { validateAndPrepareOutputDir } = require('./utils/fs-utils.js'); // Corrected import path // Import the utility
const program = new Command();

program
  .name('kline-fetcher')
  .description('CLI for fetching kline data')
  .version('0.0.1');

program
  .command('fetch')
  .description('Fetches kline data')
  .option('-o, --output-dir <path>', 'Specify the output directory for data storage', './data')
  .action(async (options) => { // Make action async
    try {
      const validatedOutputDir = await validateAndPrepareOutputDir(options.outputDir);
      console.log('Starting CLI');
      console.log(`Output Directory: ${validatedOutputDir} (Validated and Ready)`);
      // Future data fetching logic will go here
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1); // Exit with a non-zero status code on error
    }
  });

program.parse(process.argv);

