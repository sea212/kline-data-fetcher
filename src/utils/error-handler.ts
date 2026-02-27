export function formatErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred.';

  const message = error.message || String(error);
  const code = error.code || '';

  if (code === 'ENOTFOUND') {
    return `Network Error: Cannot connect to the data source (DNS lookup failed). Please check your internet connection.`;
  }

  if (code === 'EACCES' || code === 'EPERM') {
    return `Permission Error: Access denied for the output directory or files. Ensure you have the necessary write permissions.`;
  }

  if (message.includes('404') || message.includes('Not Found')) {
    return `Data Not Found: The requested symbol, interval, or market type could not be found on binance.vision.`;
  }

  if (message.includes('Corrupted archive detected')) {
    return message; // Already human-friendly
  }

  return message;
}
