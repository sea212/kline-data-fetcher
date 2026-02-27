import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { URL } from 'url'; // Node.js built-in URL module

import { KlineDiscoveryOptions } from './binance-vision.types';

export async function getKlineZipFileUrls(options: KlineDiscoveryOptions): Promise<string[]> {
  const market = options.market || 'spot';
  const dataType = options.dataType || 'monthly';

  const discoveryUrl = `https://data.binance.vision/data/${market}/${dataType}/klines/${options.symbol.toUpperCase()}/${options.interval}/`;

  console.log('Constructed discovery URL:', discoveryUrl);

  // The actual fetching/parsing will happen in Task 2.
  return [];
}
