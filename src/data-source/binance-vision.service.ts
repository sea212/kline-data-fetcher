import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { KlineDiscoveryOptions } from './binance-vision.types';

export async function getKlineZipFileUrls(options: KlineDiscoveryOptions): Promise<string[]> {
  const market = options.market || 'spot';
  const dataType = options.dataType || 'monthly';
  const symbol = options.symbol.toUpperCase();
  const interval = options.interval;

  const discoveryUrl = `https://data.binance.vision/data/${market}/${dataType}/klines/${symbol}/${interval}/`;
  console.log(`Constructed discovery URL: ${discoveryUrl}`);

  // Placeholder for actual fetching/parsing logic in Task 2
  return [];
}
