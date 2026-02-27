jest.mock('node-fetch', () => require('jest-fetch-mock'));
import fetchMock from 'jest-fetch-mock';
import { DownloadService } from '../../src/services/download.service';
import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable, Writable } from 'node:stream';

// Enable fetch mocks
fetchMock.enableMocks();

// Mock fs and fs/promises
jest.mock('node:fs');
jest.mock('node:fs/promises');
jest.mock('node:stream/promises', () => ({
  pipeline: jest.fn(),
}));

describe('DownloadService', () => {
  const mockUrl = 'https://example.com/test.zip';
  const mockDestPath = '/path/to/test.zip';

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
  });

  test('should download a file successfully (fresh start)', async () => {
    const mockBody = new Readable();
    mockBody._read = () => {};
    fetchMock.mockResponseOnce(mockBody as any);

    (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fsPromises.stat as jest.Mock).mockRejectedValue(new Error('File not found'));
    (fs.createWriteStream as jest.Mock).mockReturnValue({
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      close: jest.fn(),
      closed: false,
    });
    (pipeline as unknown as jest.Mock).mockResolvedValue(undefined);

    await DownloadService.downloadFile(mockUrl, mockDestPath);

    expect(fsPromises.mkdir).toHaveBeenCalledWith('/path/to', { recursive: true });
    expect(fetchMock).toHaveBeenCalledWith(mockUrl, expect.objectContaining({ method: 'GET' }));
    expect(fs.createWriteStream).toHaveBeenCalledWith(mockDestPath, { flags: 'w' });
    expect(pipeline).toHaveBeenCalled();
  });

  test('should throw error if URL or destPath is missing', async () => {
    await expect(DownloadService.downloadFile('', mockDestPath)).rejects.toThrow('URL and destination path are required.');
    await expect(DownloadService.downloadFile(mockUrl, '')).rejects.toThrow('URL and destination path are required.');
  });

  test('should retry on failure and eventually succeed', async () => {
    (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fsPromises.stat as jest.Mock).mockRejectedValue(new Error('File not found'));
    
    // Fail twice, succeed third time
    fetchMock.mockResponses(
      [JSON.stringify({ error: 'Transient error' }), { status: 500 }],
      [JSON.stringify({ error: 'Transient error' }), { status: 500 }],
      ['Success content', { status: 200 }]
    );

    const mockWriteStream = {
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      close: jest.fn(),
      closed: false,
    };
    (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    (pipeline as unknown as jest.Mock).mockResolvedValue(undefined);

    await DownloadService.downloadFile(mockUrl, mockDestPath, 3, 10);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fs.createWriteStream).toHaveBeenCalledWith(mockDestPath, { flags: 'w' });
  });

  test('should resume download using Range header if file exists', async () => {
    (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fsPromises.stat as jest.Mock).mockResolvedValue({ size: 100 });
    
    fetchMock.mockResponseOnce('Partial content', { status: 206 });

    const mockWriteStream = {
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      close: jest.fn(),
      closed: false,
    };
    (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    (pipeline as unknown as jest.Mock).mockResolvedValue(undefined);

    await DownloadService.downloadFile(mockUrl, mockDestPath);

    expect(fetchMock).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
      headers: expect.objectContaining({ Range: 'bytes=100-' })
    }));
    expect(fs.createWriteStream).toHaveBeenCalledWith(mockDestPath, { flags: 'a' });
  });

  test('should handle 416 Range Not Satisfiable as success', async () => {
    (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fsPromises.stat as jest.Mock).mockResolvedValue({ size: 1000 });
    
    fetchMock.mockResponseOnce('Range Not Satisfiable', { status: 416 });

    await DownloadService.downloadFile(mockUrl, mockDestPath);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fs.createWriteStream).not.toHaveBeenCalled();
  });

  test('should throw error after all retries fail', async () => {
    (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fsPromises.stat as jest.Mock).mockRejectedValue(new Error('File not found'));
    
    fetchMock.mockResponse(JSON.stringify({ error: 'Permanent error' }), { status: 500 });

    await expect(DownloadService.downloadFile(mockUrl, mockDestPath, 2, 10))
      .rejects.toThrow(/Failed to download/);

    expect(fetchMock).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});
