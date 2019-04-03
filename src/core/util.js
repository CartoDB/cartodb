var _ = require('underscore');

var util = {};

util.isCORSSupported = function () {
  return 'withCredentials' in new XMLHttpRequest();
};

util.array2hex = function (byteArr) {
  var encoded = [];
  for (var i = 0; i < byteArr.length; ++i) {
    encoded.push(String.fromCharCode(byteArr[i] + 128));
  }
  return util.btoa(encoded.join(''));
};

util.btoa = function (data) {
  if (typeof window['btoa'] === 'function') {
    return util.encodeBase64Native(data);
  }

  return util.encodeBase64(data);
};

util.encodeBase64Native = function (input) {
  return btoa(input);
};

// ie7 btoa,
// from http://phpjs.org/functions/base64_encode/
util.encodeBase64 = function (data) {
  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var o1, o2, o3, h1, h2, h3, h4, bits;
  var i = 0;
  var ac = 0;
  var enc = '';
  var tmpArr = [];

  if (!data) {
    return data;
  }

  do {
    // pack three octets into four hexets
    o1 = data.charCodeAt(i++);
    o2 = data.charCodeAt(i++);
    o3 = data.charCodeAt(i++);

    bits = (o1 << 16) | (o2 << 8) | o3;

    h1 = (bits >> 18) & 0x3f;
    h2 = (bits >> 12) & 0x3f;
    h3 = (bits >> 6) & 0x3f;
    h4 = bits & 0x3f;

    // use hexets to index into b64, and append result to encoded string
    tmpArr[ac++] =
      b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
  } while (i < data.length);

  enc = tmpArr.join('');

  var r = data.length % 3;
  return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
};

util.uniqueCallbackName = function (str) {
  util._callback_c = util._callback_c || 0;
  ++util._callback_c;
  return util.crc32(str) + '_' + util._callback_c;
};

util.crc32 = function (str) {
  var crcTable = util._crcTable || (util._crcTable = util._makeCRCTable());
  var crc = 0 ^ -1;

  for (var i = 0, l = str.length; i < l; ++i) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
  }

  return (crc ^ -1) >>> 0;
};

util._makeCRCTable = function () {
  var c;
  var crcTable = [];
  for (var n = 0; n < 256; ++n) {
    c = n;
    for (var k = 0; k < 8; ++k) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
};

util._inferBrowser = function (ua) {
  var browser = {};
  ua =
    ua || (typeof window !== 'undefined' && window.navigator.userAgent) || '';
  function detectIE () {
    var msie = ua.indexOf('MSIE ');
    var trident = ua.indexOf('Trident/');
    if (msie > -1 || trident > -1) return true;
    return false;
  }

  function getIEVersion () {
    if (!document.compatMode) return 5;
    if (!window.XMLHttpRequest) return 6;
    if (!document.querySelector) return 7;
    if (!document.addEventListener) return 8;
    if (!window.atob) return 9;
    if (document.all) return 10;
    else return 11;
  }

  if (detectIE()) {
    browser.ie = { version: getIEVersion() };
  } else if (ua.indexOf('Edge/') > -1) browser.edge = ua;
  else if (ua.indexOf('Chrome') > -1) browser.chrome = ua;
  else if (ua.indexOf('Firefox') > -1) browser.firefox = ua;
  else if (ua.indexOf('Opera') > -1) browser.opera = ua;
  else if (ua.indexOf('Safari') > -1) browser.safari = ua;
  return browser;
};

util.browser = util._inferBrowser();

util.isMobileDevice = function () {
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

util.supportsTouch = function () {
  return 'ontouchstart' in window || navigator.msMaxTouchPoints;
};

var webGLSupportedAndEnabled = null;
util.isWebGLSupported = function () {
  if (webGLSupportedAndEnabled === null) {
    var canvas = document.createElement('canvas');
    webGLSupportedAndEnabled =
      !!window.WebGLRenderingContext &&
      !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  }
  return webGLSupportedAndEnabled;
};

/**
 * Returns true if the string ends with provided suffix
 */
util.endsWith = function (str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

util.checkRequiredOpts = function (actualOpts, requiredOpts, from) {
  _.each(requiredOpts, function (item) {
    if (_.isUndefined(actualOpts[item])) {
      throw new Error(
        item + ' is required' + (from ? ' to initialize ' + from : '')
      );
    }
  });
};

/**
 * Checks that the correct Leaflet version is loaded
 */
util.isLeafletLoaded = function () {
  if (!window.L) {
    throw new Error('Leaflet is required');
  }
  if (window.L.version < '1.0.0') {
    throw new Error('Leaflet +1.0 is required');
  }
};

/**
 * Checks that the correct Google Maps version is loaded
 */
util.isGoogleMapsLoaded = function () {
  if (!window.google) {
    throw new Error('Google Maps is required');
  }
  if (!window.google.maps) {
    throw new Error('Google Maps is required');
  }
  if (window.google.maps.version < '3.31.0') {
    throw new Error('Google Maps version should be >= 3.31');
  }
};

module.exports = util;
