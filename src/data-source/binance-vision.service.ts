import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { KlineDiscoveryOptions } from './binance-vision.types';

export async function getKlineZipFileUrls(options: KlineDiscoveryOptions): Promise<string[]> {
  const market = options.market || 'spot';
  const dataType = options.dataType || 'monthly';
  const baseUrl = `https://data.binance.vision/data/${market}/${dataType}/klines/${options.symbol.toUpperCase()}/${options.interval}/`;

  console.log(`Constructed discovery URL: ${baseUrl}`); // For initial logging as per task

  // Actual fetching and parsing will be implemented in Task 2
  return [];
}
