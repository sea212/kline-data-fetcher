# Phase 2: Data Source Interaction & Discovery - Research

**Researched:** 2024-07-30
**Domain:** Data fetching, HTML parsing, URL manipulation
**Confidence:** HIGH

## Summary

This phase focuses on enabling the Kline Data Fetcher to discover available historical kline data `.zip` files from `binance.vision`. The core mechanism involves constructing specific directory URLs on `binance.vision`, making an HTTP GET request to fetch the HTML content of these directories, and then parsing the HTML to extract `.zip` file links. A crucial step is to filter out associated `.zip.CHECKSUM` files to ensure only downloadable data archives are listed. The identified `.zip` file names will then be used to construct full download URLs.

**Primary recommendation:** Utilize `node-fetch` for robust HTTP requests and `cheerio` for efficient server-side HTML parsing, following established patterns for URL construction and string manipulation.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DSID-01 | Given a symbol and interval, the tool can access the corresponding `binance.vision` directory URL. | Standard Stack, Architecture Patterns |
| DSID-02 | The tool can parse the HTML of the directory URL to find links to `.zip` files. | Standard Stack, Architecture Patterns |
| DSID-03 | The tool successfully filters out `.zip.CHECKSUM` links. | Architecture Patterns, Code Examples |
| DSID-04 | The tool can present a list of valid `.zip` file URLs. | Architecture Patterns, Code Examples |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node-fetch` | ^3.x | HTTP client for `fetch` API in Node.js | Provides a modern, browser-compatible API for making HTTP requests. |
| `cheerio` | ^1.2.0 | Fast, flexible, & elegant HTML parser | Implements a subset of jQuery's API, ideal for server-side HTML manipulation without a full DOM. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `url` (Node.js built-in) | N/A | URL parsing and resolution | For robust joining of base URLs and relative paths, though string concatenation might suffice for simple cases. |

**Installation:**
```bash
npm install node-fetch cheerio
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── data-source/        # Contains logic for interacting with binance.vision
│   ├── binance-vision.service.ts # Service for fetching and parsing binance.vision data
│   └── types.ts        # Type definitions for binance data
├── cli/                # (from previous phase)
└── utils/              # (from previous phase)
```

### Pattern 1: URL Construction for Directory Listing
**What:** Dynamically build the `binance.vision` URL for a specific market, data type (daily/monthly), symbol, and interval, which serves as a directory listing.
**When to use:** When needing to discover available files rather than fetching a specific file.
**Example:**
```typescript
// Assuming 'spot' market and 'monthly' data type for discovery
function getKlineDiscoveryUrl(symbol: string, interval: string, market: 'spot' | 'futures/um' | 'futures/cm' = 'spot', dataType: 'monthly' | 'daily' = 'monthly'): string {
    const baseUrl = 'https://data.binance.vision/data';
    return `${baseUrl}/${market}/${dataType}/klines/${symbol.toUpperCase()}/${interval}/`;
}

// Example usage:
const url = getKlineDiscoveryUrl('BTCUSDT', '1h');
console.log(url); // https://data.binance.vision/data/spot/monthly/klines/BTCUSDT/1h/
```

### Pattern 2: Fetch and Parse HTML
**What:** Fetch the HTML content from the constructed URL and parse it using `cheerio` to enable DOM-like traversal and element selection.
**When to use:** After constructing the discovery URL, to extract file links.
**Example:**
```typescript
// Source: node-fetch and cheerio official docs
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function fetchAndParseHtml(url: string): Promise<cheerio.CheerioAPI> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        return cheerio.load(html);
    } catch (error) {
        console.error(`Failed to fetch or parse HTML from ${url}:`, error);
        throw error;
    }
}
```

### Anti-Patterns to Avoid
-   **Hardcoding URLs:** Avoid hardcoding full `binance.vision` URLs beyond the base path. Use the dynamic construction pattern.
-   **Regex for HTML Parsing:** Do not use regular expressions to parse HTML. HTML is not a regular language, and regex is brittle for this purpose. `cheerio` (or any proper HTML parser) is the correct tool.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP Requests | Custom `http`/`https` modules | `node-fetch` | Handles redirects, encoding, streaming, error handling, and provides a cleaner promise-based API. |
| HTML Parsing | Manual string splitting/regex | `cheerio` | `cheerio` provides a robust, battle-tested, and familiar API (jQuery-like) for navigating and querying the DOM, handling edge cases and malformed HTML gracefully. |
| URL joining | String concatenation for complex paths | `new URL(path, base)` (built-in) | Correctly handles slashes, relative paths, and ensures valid URL construction. |

**Key insight:** Networking and HTML parsing are complex domains with many edge cases (e.g., character encodings, HTTP status codes, malformed HTML, redirect handling). Relying on specialized, well-maintained libraries prevents common bugs and security vulnerabilities.

## Common Pitfalls

### Pitfall 1: Ignoring HTTP Status Codes
**What goes wrong:** Attempting to parse HTML from an error response (e.g., 404 Not Found, 500 Server Error) without checking `response.ok` or `response.status`. This leads to parsing failures or incorrect data.
**Why it happens:** Assuming all HTTP responses will be successful and contain valid HTML.
**How to avoid:** Always check `response.ok` or `response.status` after an `fetch` call. Throw an error or return an empty result for non-successful responses.
**Warning signs:** `cheerio` failing to load, or loading an unexpected error page HTML.

### Pitfall 2: Incorrect URL Resolution
**What goes wrong:** Relative URLs found in `<a>` tags are not correctly combined with the base URL, leading to invalid download links.
**Why it happens:** Simple string concatenation might fail when dealing with varying slash conventions or nested paths.
**How to avoid:** Use `new URL(relativePath, baseUrl)` constructor for robust URL resolution.
**Warning signs:** Download links resulting in 404s or pointing to unintended resources.

### Pitfall 3: Not Filtering Checksum Files
**What goes wrong:** The list of downloadable files includes `.zip.CHECKSUM` entries, leading to attempts to download non-data files.
**Why it happens:** Insufficient filtering of `href` attributes extracted from HTML.
**How to avoid:** Explicitly filter out any `href` ending with `.zip.CHECKSUM`.
**Warning signs:** User attempts to download `.CHECKSUM` files, or the CLI tool tries to process them as kline data.

## Code Examples

Verified patterns from official sources:

### Fetching HTML and Extracting `.zip` Links
```typescript
// Source: Adapted from node-fetch and cheerio official documentation
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * Fetches HTML from a URL, parses it, and extracts valid .zip file URLs.
 * @param discoveryUrl The base URL of the binance.vision directory listing.
 * @returns A promise that resolves to an array of full .zip file URLs.
 */
async function getKlineZipFileUrls(discoveryUrl: string): Promise<string[]> {
    const zipFileUrls: string[] = [];
    try {
        const response = await fetch(discoveryUrl);
        if (!response.ok) {
            console.error(`Failed to fetch ${discoveryUrl}: HTTP status ${response.status}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        $('a').each((_i, element) => {
            const href = $(element).attr('href');
            if (href && href.endsWith('.zip') && !href.endsWith('.zip.CHECKSUM')) {
                // Construct full URL using URL constructor for robustness
                const fullUrl = new URL(href, discoveryUrl).toString();
                zipFileUrls.push(fullUrl);
            }
        });
    } catch (error) {
        console.error(`Error processing ${discoveryUrl}:`, error);
    }
    return zipFileUrls;
}

// Example Usage (for BTCUSDT 1h monthly data)
async function exampleUsage() {
    const symbol = 'BTCUSDT';
    const interval = '1h';
    const discoveryUrl = `https://data.binance.vision/data/spot/monthly/klines/${symbol.toUpperCase()}/${interval}/`;
    const urls = await getKlineZipFileUrls(discoveryUrl);
    console.log(`Discovered .zip files for ${symbol}-${interval}:`);
    urls.forEach(url => console.log(url));
}

// exampleUsage(); // Uncomment to test
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `XMLHttpRequest` or Node's `http` module | `fetch` API (`node-fetch` in Node.js) | ES6/ES2015+ | Simpler, promise-based API; consistent across browser/Node.js; better error handling. |
| Manual string parsing / regex for HTML | `cheerio` / `jsdom` | Early 2010s | Dramatically improved robustness, maintainability, and safety of HTML manipulation. |

**Deprecated/outdated:**
-   `request` library: Widely deprecated in favor of `node-fetch` or `axios` due to maintenance issues and API changes.
-   Directly accessing `http.get` callback-style: Replaced by promise-based `fetch` for better async control.

## Open Questions

1.  **Market and Data Type Selection:**
    -   What we know: `binance.vision` supports `spot`, `futures/um`, `futures/cm` markets, and `monthly`/`daily` data types.
    -   What's unclear: How the tool should allow the user to specify these or if it should attempt to discover across all of them by default.
    -   Recommendation: Start with `spot` and `monthly` as defaults for initial implementation. Implement user configuration (e.g., CLI arguments) for market and data type in a later phase if required.

2.  **Performance with Many Links:**
    -   What we know: A directory listing could potentially contain many links (e.g., hundreds of daily files).
    -   What's unclear: If parsing and filtering a very large number of links will cause performance issues.
    -   Recommendation: `cheerio` is generally fast. Monitor performance during testing. If issues arise, consider streaming HTML parsing (e.g., `htmlparser2` directly) for very large responses, but this is an optimization.

## Sources

### Primary (HIGH confidence)
-   [node-fetch - npm](https://www.npmjs.com/package/node-fetch) - Installation, usage, API.
-   [cheerio - npm](https://www.npmjs.com/package/cheerio) - Installation, usage, API.
-   [WebSearch for "binance vision kline data url structure"] - Confirmed URL patterns for `binance.vision`.

### Secondary (MEDIUM confidence)
-   N/A

### Tertiary (LOW confidence)
-   N/A

## Metadata

**Confidence breakdown:**
-   Standard stack: HIGH - `node-fetch` and `cheerio` are industry standards for their respective tasks in Node.js, with comprehensive documentation.
-   Architecture: HIGH - Patterns for URL construction, fetching, and parsing are straightforward and well-understood.
-   Pitfalls: HIGH - Common issues like error handling, URL resolution, and filtering are well-documented in web development.

**Research date:** 2024-07-30
**Valid until:** 2025-01-30 (6 months, as the underlying APIs and data sources are relatively stable)
