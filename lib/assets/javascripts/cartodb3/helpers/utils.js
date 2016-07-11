var _ = require('underscore');

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
    var rgb = this.hexToRGB(hex);
    return 'rgba(' + [rgb.r, rgb.g, rgb.b, opacity].join(', ') + ')';
  }
};
