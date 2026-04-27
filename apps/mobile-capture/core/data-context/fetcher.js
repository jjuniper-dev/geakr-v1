/**
 * Data Fetcher
 *
 * Extracts from: core/baseline/fetcher.js
 *
 * Responsible for:
 * - Fetching readable content from URLs
 * - Extracting title and text
 * - Cleaning up HTML
 */

import axios from 'axios';
import cheerio from 'cheerio';

const FETCH_TIMEOUT = 15000;
const MAX_TEXT_LENGTH = 20000;

export async function fetchReadable(url, options = {}) {
  const timeout = options.timeout || FETCH_TIMEOUT;
  const maxLength = options.maxLength || MAX_TEXT_LENGTH;

  try {
    const { data } = await axios.get(url, { timeout });
    const $ = cheerio.load(data);

    const title = ($('title').text() || '').trim();

    // Remove script, style, and noscript tags
    $('script,style,noscript').remove();

    // Extract text from body
    const text = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength);

    return {
      title,
      text,
      url,
      status: 'success',
      contentLength: text.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Failed to reach URL: ${url}. ${error.message}`);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Fetch timeout (${timeout}ms) for URL: ${url}`);
    }
    throw new Error(`Failed to fetch URL: ${url}. ${error.message}`);
  }
}

export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
