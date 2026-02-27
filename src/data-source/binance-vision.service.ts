import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { KlineDiscoveryOptions } from './binance-vision.types';

export async function getKlineZipFileUrls(options: KlineDiscoveryOptions): Promise<string[]> {
  const market = options.market || 'spot';
  const dataType = options.dataType || 'monthly';
  const symbol = options.symbol.toUpperCase();

  const discoveryUrl = `https://data.binance.vision/data/${market}/${dataType}/klines/${symbol}/${options.interval}/`;
  console.log(`Discovering kline data from: ${discoveryUrl}`);

  // The actual fetching/parsing will happen in Task 2.
  return [];
}
