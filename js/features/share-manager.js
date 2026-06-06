/**
 * ShareManager - Generate shareable URLs for calculations.
 * Encodes calculation parameters into URL query strings.
 * Requirements: 12.3, 12.4
 */

const ShareManager = {
  /**
   * Encode calculation parameters into a shareable URL.
   * @param {Object} params - { type: string, inputs: Object, options?: Object }
   * @returns {string} Full URL with query parameters
   */
  encode(params) {
    const encoded = btoa(JSON.stringify(params));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?calc=${encodeURIComponent(encoded)}`;
  },

  /**
   * Decode calculation parameters from a URL query string.
   * @param {string} [url] - URL to decode (defaults to current window.location)
   * @returns {Object|null} Decoded params or null if no calc param
   */
  decode(url) {
    try {
      const urlObj = new URL(url || window.location.href);
      const calcParam = urlObj.searchParams.get('calc');
      if (!calcParam) return null;
      const decoded = JSON.parse(atob(decodeURIComponent(calcParam)));
      return decoded;
    } catch (e) {
      console.warn('[ShareManager] Failed to decode URL:', e);
      return null;
    }
  },

  /**
   * Copy the share URL to clipboard and return success status.
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async copyToClipboard(url) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
      }
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (e) {
      console.warn('[ShareManager] Failed to copy to clipboard:', e);
      return false;
    }
  },

  /**
   * Check if current page has a shared calculation in the URL.
   * If so, return the decoded parameters.
   * @returns {Object|null}
   */
  checkForSharedCalc() {
    return this.decode(window.location.href);
  }
};

export default ShareManager;
