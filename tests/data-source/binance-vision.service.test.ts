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

  const baseS3Url = 'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision/?prefix=data/spot/monthly/klines/BTCUSDT/1m/';
  const baseDataUrl = 'https://data.binance.vision/';
  const mockOptions: KlineDiscoveryOptions = {
    symbol: 'BTCUSDT',
    interval: '1m',
  };

  // Test Case 1: Successful discovery with valid and invalid links (XML response)
  test('should return only valid .zip file URLs for successful discovery', async () => {
    const mockXml = `
      <ListBucketResult>
        <Contents>
          <Key>data/spot/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2023-01.zip</Key>
        </Contents>
        <Contents>
          <Key>data/spot/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2023-01.zip.CHECKSUM</Key>
        </Contents>
        <Contents>
          <Key>data/spot/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2023-02.zip</Key>
        </Contents>
        <Contents>
          <Key>data/spot/monthly/klines/BTCUSDT/1m/README.txt</Key>
        </Contents>
      </ListBucketResult>
    `;
    fetchMock.mockResponseOnce(mockXml, { status: 200 });

    const result = await getKlineZipFileUrls(mockOptions);

    expect(result).toEqual([
      `${baseDataUrl}data/spot/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2023-01.zip`,
      `${baseDataUrl}data/spot/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2023-02.zip`,
    ]);
    expect(fetchMock).toHaveBeenCalledWith(baseS3Url);
  });

  // Test Case 2: No .zip files found
  test('should return an empty array when no .zip files are found', async () => {
    const mockXml = `
      <ListBucketResult>
        <Contents>
          <Key>data/spot/monthly/klines/BTCUSDT/1m/README.txt</Key>
        </Contents>
      </ListBucketResult>
    `;
    fetchMock.mockResponseOnce(mockXml, { status: 200 });

    const result = await getKlineZipFileUrls(mockOptions);

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(baseS3Url);
  });

  // Test Case 3: HTTP error response (e.g., 404)
  test('should return an empty array on HTTP error response', async () => {
    fetchMock.mockResponseOnce('Not Found', { status: 404, statusText: 'Not Found' });

    const result = await getKlineZipFileUrls(mockOptions);

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(baseS3Url);
  });

  // Test Case 4: Network error
  test('should return an empty array on network error', async () => {
    fetchMock.mockRejectOnce(new Error('Network failure'));

    const result = await getKlineZipFileUrls(mockOptions);

    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(baseS3Url);
  });

  // Test Case 5: Different market and dataType
  test('should construct correct URL for futures/um market and daily dataType', async () => {
    const futuresOptions: KlineDiscoveryOptions = {
      symbol: 'BTCUSDT',
      interval: '1m',
      market: 'futures/um',
      dataType: 'daily',
    };
    const futuresDiscoveryUrl = 'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision/?prefix=data/futures/um/daily/klines/BTCUSDT/1m/';

    fetchMock.mockResponseOnce('', { status: 200 }); // Mock response to avoid actual fetch

    await getKlineZipFileUrls(futuresOptions);

    expect(fetchMock).toHaveBeenCalledWith(futuresDiscoveryUrl);
  });
});
