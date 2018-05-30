const URL = require('url-parse');

/**
 * @param {string} url
 * @returns {Object|null}
 */
function parseDomain (url) {
  var matches = url.match(/https?:\/\/(www\.)?[^/]+/);

  if (!matches) {
    return { msg: 'invalid url: ' + url };
  }

  url = matches[0].replace(/www\./ig, '');

  var urlSplit;
  var tld;
  var domain;
  var subdomain;

  if (!url || typeof url !== 'string') {
    return null;
  }

  // parse URL
  var obj = new URL(url);

  // check if tld is supported
  urlSplit = obj.host.split('.');
  tld = urlSplit[urlSplit.length - 1];
  domain = urlSplit.slice(urlSplit.length - 2, urlSplit.length - 1).join('.');
  subdomain = urlSplit.slice(0, urlSplit.length - 2).join('.');

  return {
    tld: tld,
    domain: domain,
    subdomain: subdomain,
    dtld: (subdomain ? subdomain + '.' : '') + domain + '.' + tld
  };
}

module.exports = parseDomain;
