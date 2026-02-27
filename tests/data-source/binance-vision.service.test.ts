jest.mock('node-fetch', () => require('jest-fetch-mock'));
import fetchMock from 'jest-fetch-mock';
import { getKlineZipFileUrls } from '../../src/data-source/binance-vision.service';
import { KlineDiscoveryOptions } from '../../src/data-source/binance-vision.types';

// Enable fetch mocks
fetchMock.enableMocks();

describe('getKlineZipFileUrls', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  const baseDiscoveryUrl = 'https://data.binance.vision/data/spot/monthly/klines/BTCUSDT/1m/';
  const mockOptions: KlineDiscoveryOptions = {
    symbol: 'BTCUSDT',
    interval: '1m',
  };

  // Test Case 1: Successful discovery with valid and invalid links
  test('should return only valid .zip file URLs for successful discovery', async () => {
    const mockHtml = `
      <html>
        <body>
          <a href="${baseDiscoveryUrl}BTCUSDT-1m-2023-01.zip"></a>
          <a href="${baseDiscoveryUrl}BTCUSDT-1m-2023-01.zip.CHECKSUM"></a>
          <a href="${baseDiscoveryUrl}BTCUSDT-1m-2023-02.zip"></a>
          <a href="/some-other-link"></a>
          <a href="http://external.com/file.zip"></a>
        </body>
      </html>
    `;
    fetchMock.mockResponseOnce(mockHtml, { status: 200 });

    const result = await getKlineZipFileUrls(mockOptions);

    expect(result).toEqual([
      `${baseDiscoveryUrl}BTCUSDT-1m-2023-01.zip`,
      `${baseDiscoveryUrl}BTCUSDT-1m-2023-02.zip`,
    ]);
    expect(fetchMock).toHaveBeenCalledWith(baseDiscoveryUrl);
  });

  // Test Case 2: No .zip files found
  test('should return an empty array when no .zip files are found', async () => {
    const mockHtml = `
      <html>
        <body>
          <a href="/some-other-link"></a>
          <a href="/another-file.txt"></a>
        </body>
      </html>
    `;
    fetchMock.mockResponseOnce(mockHtml, { status: 200 });

    const result = await getKlineZipFileUrls(mockOptions);

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(baseDiscoveryUrl);
  });

  // Test Case 3: HTTP error response (e.g., 404)
  test('should return an empty array on HTTP error response', async () => {
    fetchMock.mockResponseOnce('Not Found', { status: 404, statusText: 'Not Found' });

    const result = await getKlineZipFileUrls(mockOptions);

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(baseDiscoveryUrl);
  });

  // Test Case 4: Network error
  test('should return an empty array on network error', async () => {
    fetchMock.mockRejectOnce(new Error('Network failure'));

    const result = await getKlineZipFileUrls(mockOptions);

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(baseDiscoveryUrl);
  });

  // Test Case 5: Different market and dataType
  test('should construct correct URL for futures/um market and daily dataType', async () => {
    const futuresOptions: KlineDiscoveryOptions = {
      symbol: 'BTCUSDT',
      interval: '1m',
      market: 'futures/um',
      dataType: 'daily',
    };
    const futuresDiscoveryUrl = 'https://data.binance.vision/data/futures/um/daily/klines/BTCUSDT/1m/';

    fetchMock.mockResponseOnce('', { status: 200 }); // Mock response to avoid actual fetch

    await getKlineZipFileUrls(futuresOptions);

    expect(fetchMock).toHaveBeenCalledWith(futuresDiscoveryUrl);
  });
});
