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
    console.log(`Discovering kline zip files from: ${discoveryUrl}`); // For initial testing/logging

    // The actual fetching and parsing logic will be implemented in Task 2.
    // For now, return an empty array or log the URL as per Task 1 instructions.
    return [];
}
