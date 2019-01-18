var _ = require('underscore');
var cdb = require('internal-carto.js');

/*
 *  Util functions
 */

module.exports = {
  /*
   *  Simple regex to check if string is an url/ftp
   *  input ->  string with input text (example: 'https://carto.com')
   *
   *  return -> true
   */
  isURL: function (input) {
    var urlregex = /^((http|https|ftp)\:\/\/)/g;
    if (input) {
      return urlregex.test(input);
    } else {
      return false;
    }
  },

  /*
   *  check if string is blank (i.e.: str === "")
   *  input ->  string with input text
   *
   * @return a boolean
   */
  isBlank: function (str) {
    return (!str || /^\s*$/.test(str));
  },
  /*
   *  Transform bytes to a readable format, like MB, GB
   *  input ->  34234244
   *
   *  return -> 3 MB
   */
  readablizeBytes: function (bytes, round) {
    if (!bytes || isNaN(bytes)) {
      return 0;
    }
    var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    var value = (bytes / Math.pow(1024, Math.floor(e))).toFixed(2);

    if (round) {
      value = parseInt(value, 10);
    }

    return value + ' ' + s[e];
  },

  /**
   *  Convert long numbers to
   *  readizable numbers.
   *
   */
  readizableNumber: function (num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'G';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  },

  /*
   * formatNumber: adds thousands separators
   * @return a string
   *
   */
  formatNumber: function (x) {
    if (!x) return '0';
    var parts = x.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  },

  /**
   * Similar to _.result, but also allows passing arbitrary arguments to the property if it's function.
   * This makes code more terse  when one just wants to use a value if it's available, no if-checks required.
   *
   * @example Expected output
   *   model.set('something', 'yay');
   *   cdb.Utils.result(model, 'get', 'something') // => 'yay'
   *   cdb.Utils.result(model, 'nonexisting', 'else') // => undefined
   *   cdb.Utils.result(undefinedVar, 'get') // => null
   *
   * @example Of usage
   *  return cdb.Utils.result(model, 'get', 'mightNotExist') === 'OK'
   *
   * @param {*} maybeFn
   * @return {*} Result from called maybeFn if a function, null otherwise
   */
  result: function (object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.apply(object, Array.prototype.slice.call(arguments, 2)) : value;
  },

  /**
   *  Get the extension of a string
   *
   */
  getFileExtension: function (str) {
    if (!str) return '';
    return str.substr(str.lastIndexOf('.') + 1);
  },

  /**
   *  Add leading zeros to numbers
   *
   */
  pad: function (num, size) {
    var s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  },

  formatDate: function (opts) {
    if (!opts.time) throw new Error();
    if (opts.month === undefined) throw new Error();
    if (opts.year === undefined) throw new Error();
    if (!opts.day) throw new Error();

    // Month in Date format should be specified as an index
    var month = parseInt(opts.month + 1, 10);
    var padZero = function (digit) {
      digit = String(digit);
      if (digit < 10 && digit.length === 1) {
        return '0' + digit;
      }
      return digit;
    };

    return '' +
      opts.year + '-' +
      padZero(month) + '-' +
      padZero(opts.day) + 'T' +
      opts.time + 'Z';
    // Not adding any info about timezone
  },

  /*
   * rgbToHex
   *
   */
  rgbToHex: function (r, g, b) {
    function componentToHex (c) {
      var hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }

    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
  },

  /*
   *  Returns true if the hex color passed as an input is valid
   *  input -> hex (#FF00FF)
   *  output -> true
   *
   * @return a boolean
   */
  isValidHex: function (hex) {
    return !!hex.match(/(^#?[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i);
  },

  /*
   * Returns #FFFFFF in case the input is not a valid HEX number
   */
  sanitizeHex: function (hex) {
    if (!this.isValidHex(hex)) {
      return '#FFFFFF';
    }
    return hex;
  },

  /*
   *  Transforms an hex color into its RGB representation
   *  input ->  hex (#FF00FF)
   *  output ->  { r: 255, g: 0, b: 255 }
   *
   * @return a hash
   */
  hexToRGB: function (hex) {
    if (!hex) {
      hex = '#FFFFFF';
    }

    var shortRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;

    hex = hex.replace(shortRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  /*
   *  Transforms an hex color an a opacity value to a rgba string
   *  input ->  hex (#FF00FF) and opacity (0.4)
   *  output -> 'rgba(255,0,255,0.4)'
   *
   * @return a string
   */
  hexToRGBA: function (hex, opacity) {
    function roundToTwo (num) {
      return +(Math.round(num + 'e+2') + 'e-2');
    }

    var rgb = this.hexToRGB(hex);
    opacity = opacity != null ? roundToTwo(opacity) : 1;
    if (rgb) {
      return 'rgba(' + [rgb.r, rgb.g, rgb.b, opacity].join(', ') + ')';
    } else {
      return hex;
    }
  },

  /*
   *  Strip html tags from a value.
   *  input ->  string with input text (example: '<a href="#whoknows">Jamon</a> </br> <p>Vamos</p>')
   *  allowed -> allowed html tags in the result (example: '<a>')
   *
   *  return -> '<a href="#whoknows">Jamon</a> Vamos'
   */
  stripHTML: function (input, allowed) {
    allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    if (!input || (typeof input !== 'string')) return '';
    return input.replace(tags, function ($0, $1) {
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
  },

  /**
   *  Replace all HTML characters to display HTML content in HTML
   *  <h1>Hello</h1> -> &lt;h1&gt;Hello&lt;/h1&gt; displays '<h1>Hello</h1>'
   *
   */
  escapeHTML: function (str) {
    return _.escape(str);
  },

  /**
   *  Remove all non-common characters like spaces, quotes, accents, etc. and
   *  joins strings with underscore symbols
   *
   */
  sanitizeString: function (str) {
    return str.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '_');
  },

  /**
   *  Returns true is value is a valid number. Based on jQuery isNumeric
   */
  isNumeric: function (value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  /**
   * Formats a number that to include up to 2 decimal positions if less than 10
   * and up to 1 if greater than 10.
   */
  formatDecimalPositions: function (value) {
    // we are using here the unary operator because parseInt fails to handle exponential number
    var converted = +value;
    var p = 0;
    var abs_v;

    if (isNaN(converted) || converted === 0) {
      return value;
    }

    abs_v = Math.abs(converted);

    if (abs_v > 10) {
      p = 1;
    } else if (abs_v > 0.01) {
      p = Math.min(Math.ceil(Math.abs(Math.log(abs_v) / Math.log(10))) + 2, 2);
    }

    value = value.toFixed(p);
    var m = value.match(/(\.0+)$/);
    if (m) {
      value = value.replace(m[0], '');
    }

    return value;
  },

  /**
   *  Remove new lines from string
   *
   */
  removeNewLines: function (str) {
    return str.replace(/(\r\n|\n|\r)/gm, '');
  },

  replaceLastSpaceWithNbsp: function (string) {
    var nbsp = '\u00a0';
    var lastSpace = string.lastIndexOf(' ');

    return string.substr(0, lastSpace) + nbsp + string.substr(lastSpace + 1);
  },

  /**
   * Returns true if the string ends with provided suffix
   */
  endsWith: function (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  },

  cloneObject: function (obj) {
    if (!obj) {
      return obj;
    }
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   *  Capitalize first letter of string
   *
   */
  capitalize: function (str) {
    if (!str) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  sanitizeHtml: function (text) {
    return cdb.core.sanitize.sanitize(text || '');
  },

  /**
   *  Returns true if the value is present
   *
   */

  hasValue: function (value) {
    return value !== null &&
      value !== undefined &&
      value !== '' &&
      !(typeof value === 'number' && isNaN(value));
  },

  isValidEmail: function (email) {
    const EMAIL_REGEX = /^([^@]+)@([^@]+)\.([^@\.]+)$/i;

    return EMAIL_REGEX.test(email);
  }
};
