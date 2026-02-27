import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { URL } from 'url'; // Node.js built-in URL module

import { KlineDiscoveryOptions, KlineFileUrlResult } from './binance-vision.types';

/**
 * Constructs the binance.vision URL for a specific market, data type, symbol, and interval.
 * @param options The discovery options.
 * @returns The constructed URL string.
 */
function getKlineDiscoveryUrl(options: KlineDiscoveryOptions): string {
    const { symbol, interval, market = 'spot', dataType = 'monthly' } = options;
    const baseUrl = 'https://data.binance.vision/data';
    return `${baseUrl}/${market}/${dataType}/klines/${symbol.toUpperCase()}/${interval}/`;
}

export async function getKlineZipFileUrls(options: KlineDiscoveryOptions): Promise<KlineFileUrlResult> {
  const discoveryUrl = getKlineDiscoveryUrl(options);
  console.log(`Discovering kline zip files from: ${discoveryUrl}`);

  let response;
  try {
    response = await fetch(discoveryUrl);
  } catch (error) {
    console.error(`Failed to fetch discovery URL ${discoveryUrl}:`, error);
    return []; // Return empty array on network error
  }

  if (!response.ok) {
    console.error(`Failed to fetch discovery URL ${discoveryUrl}: ${response.status} ${response.statusText}`);
    return []; // Return empty array on HTTP error
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const zipFileUrls: string[] = [];
  $('a').each((_i, link) => {
    const href = $(link).attr('href');
    if (href && href.endsWith('.zip') && !href.endsWith('.zip.CHECKSUM')) {
      const fullUrl = new URL(href, discoveryUrl).toString();
      if (fullUrl.startsWith(discoveryUrl)) {
        zipFileUrls.push(fullUrl);
      }
    }
  });

  return zipFileUrls;
}
