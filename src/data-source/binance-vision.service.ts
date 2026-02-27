import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { KlineDiscoveryOptions, KlineFileUrlResult } from './binance-vision.types';

export async function getKlineZipFileUrls(options: KlineDiscoveryOptions): Promise<KlineFileUrlResult> {
  const { symbol, interval, market = 'spot', dataType = 'monthly' } = options;

  const baseUrl = `https://data.binance.vision/data/${market}/${dataType}/klines/`;
  const discoveryUrl = new URL(`${symbol.toUpperCase()}/${interval}/`, baseUrl);

  console.log(`Discovering kline data at: ${discoveryUrl.toString()}`);

  // The actual fetching and parsing will happen in Task 2.
  return [];
}
