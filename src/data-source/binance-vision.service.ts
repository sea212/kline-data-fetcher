import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { KlineDiscoveryOptions } from './binance-vision.types';

export async function getKlineZipFileUrls(options: KlineDiscoveryOptions): Promise<string[]> {
  const { symbol, interval, market = 'spot', dataType = 'monthly' } = options;

  const baseUrl = `https://data.binance.vision/data/${market}/${dataType}/klines/${symbol.toUpperCase()}/${interval}/`;

  console.log(`Discovery URL: ${baseUrl}`);
  return [];
}
