import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { KlineDiscoveryOptions, KlineFileUrlResult } from './binance-vision.types';

export async function getKlineZipFileUrls(options: KlineDiscoveryOptions): Promise<KlineFileUrlResult> {
  const market = options.market || 'spot';
  const dataType = options.dataType || 'monthly';
  const symbol = options.symbol.toUpperCase();
  const interval = options.interval;

  const discoveryUrl = `https://data.binance.vision/data/${market}/${dataType}/klines/${symbol}/${interval}/`;

  console.log(`Discovering kline data at: ${discoveryUrl}`);

  // The actual fetching/parsing will happen in Task 2.
  return [];
}
