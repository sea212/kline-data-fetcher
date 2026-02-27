#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

program
  .name('kline-fetcher')
  .description('CLI for fetching kline data from binance.vision')
  .version('0.0.1');

program
  .command('fetch')
  .description('Fetch kline data for a given symbol and interval')
  .option('-o, --output-dir <path>', 'Specify the output directory for data storage', './data')
  .action((options) => {
    console.log('Starting CLI');
    console.log(`Output Directory: ${options.outputDir}`);
  });

program.parse(process.argv);
