/**
 * App servers for parallel runs. BASE_URLS is a comma-separated list of storefront URLs, one per worker,
 * e.g. BASE_URLS=http://localhost:5001,http://localhost:5002. Every test resets the data on the server it
 * talks to, so parallel workers each need a server of their own.
 */
export const appServerURLs: string[] = (process.env.BASE_URLS ?? '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);
