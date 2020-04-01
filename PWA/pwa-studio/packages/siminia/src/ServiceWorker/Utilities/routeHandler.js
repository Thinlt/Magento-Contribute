/**
 * Checks if the given URL object belongs to the home route `/`.
 *
 * @param {URL} url
 *
 * @returns {boolean}
 */
export const isHomeRoute = url => url.pathname === '/';

/**
 * Checks if the given URL object belongs to the home route `/`
 * or has a `.html` extension.
 *
 * @param {URL} url
 *
 * @returns {boolean}
 */
export const isHTMLRoute = url =>
    //isHomeRoute(url) || new RegExp('.html$').test(url.pathname);
    (isHomeRoute(url) || new RegExp('.html$').test(url.pathname))
        && (url.pathname.indexOf('Store') === -1)
        && (url.pathname.indexOf('Secure') === -1)
        && (url.pathname.indexOf('admin') === -1
        && (url.pathname.indexOf('secure') === -1))
