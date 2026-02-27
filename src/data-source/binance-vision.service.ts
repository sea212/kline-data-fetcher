import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { URL } from 'url'; // Node.js built-in URL module

import { KlineDiscoveryOptions, KlineFileUrlResult } from './binance-vision.types';

export async function getKlineZipFileUrls(options: KlineDiscoveryOptions): Promise<KlineFileUrlResult> {
  const market = options.market || 'spot';
  const dataType = options.dataType || 'monthly';
  const prefix = `data/${market}/${dataType}/klines/${options.symbol.toUpperCase()}/${options.interval}/`;
  const discoveryUrl = `https://s3-ap-northeast-1.amazonaws.com/data.binance.vision/?prefix=${prefix}`;

  try {
    const response = await fetch(discoveryUrl);

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status} for URL: ${discoveryUrl}`);
      return [];
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const zipFileUrls: string[] = [];

    $('Key').each((_i, element) => {
      const key = $(element).text();
      if (key.endsWith('.zip') && !key.endsWith('.zip.CHECKSUM')) {
        zipFileUrls.push(`https://data.binance.vision/${key}`);
      }
    });
    return zipFileUrls;
  } catch (error) {
    console.error(`Failed to fetch or parse kline data from ${discoveryUrl}:`, error);
    return [];
  }
}
