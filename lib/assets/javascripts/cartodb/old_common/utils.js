

  /*
   *  Utils for CartoDB App
   */

  cdb.Utils = {};


  /*
   *  Strip html tags from a value.
   *  input ->  string with input text (example: '<a href="#whoknows">Jamon</a> </br> <p>Vamos</p>')
   *  allowed -> allowed html tags in the result (example: '<a>')
   *
   *  return -> '<a href="#whoknows">Jamon</a> Vamos'
   */

  cdb.Utils.stripHTML = function(input, allowed) {
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    if (!input || (typeof input != "string")) return '';
    return input.replace(tags, function ($0, $1) {
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
  }


  /*
   *  Remove events attached in html code.
   *  input ->  string with input text (example: '<a href="#whoknows" onClick="alert('jamon')">Jamon</a>')
   *
   *  return -> '<a href="#whoknows">Jamon</a>'
   */

  cdb.Utils.removeHTMLEvents = function(input) {
    if (input) {
      return input.replace(/ on\w+="[^"]*"/g, '');
    } else {
      return '';
    }
  }

  /*
   *  Truncate a string
   *  input -> string with input text
   *  length -> length of the output string
   *
   *  return -> true
   */

  cdb.Utils.truncate = function(input, length) {
    return input.substr(0, length-1) + (input.length > length ? '&hellip;' : '');
  }


  /*
   *  Simple regex to check if string is an url/ftp
   *  input ->  string with input text (example: 'https://carto.com')
   *
   *  return -> true
   */

  cdb.Utils.isURL = function(input) {
    var urlregex = /^((http|https|ftp)\:\/\/)/g;
    if (input) {
      return urlregex.test(input);
    } else {
      return false;
    }
  }


  cdb.Utils.encodeURLParams = function(url) {
    if (this.isURL(url)) {
      var urlParts = url.split('?');
      if (urlParts.length > 1) {
        return urlParts[0] + '?' + encodeURIComponent(urlParts[1]);
      } else {
        return url;
      }
    }
    return url;
  }


  /*
   *  Transform bytes to a readable format, like MB, GB
   *  input ->  34234244
   *
   *  return -> 3 MB
   */

  cdb.Utils.readablizeBytes = function(bytes, round) {
    if (!bytes || isNaN(bytes)) {
      return 0;
    }
    var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes)/Math.log(1024));
    var value = (bytes/Math.pow(1024, Math.floor(e))).toFixed(2);

    if (round) { value = parseInt(value) }

    return value + " " + s[e];
  }

  /*
   * isEmpty
   *
   */
  cdb.Utils.isEmpty = function(str) {
    return (!str || 0 === str.length);
  }

  /*
   * isBlank
   *
   */
  cdb.Utils.isBlank = function(str) {
    return (!str || /^\s*$/.test(str));
  }

  /*
   * formatNumber: adds thousands separators
   * @return a string
   *
   */
  cdb.Utils.formatNumber = function(x) {
    if (!x) return "0";
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  /*
   * rgbToHex
   *
   */
  cdb.Utils.rgbToHex = function(r, g, b) {

    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  /*
   * hexToRGB
   *
   */
  cdb.Utils.hexToRGB = function(hex) {

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;

  }


  /*
   *  Generate random password
   *
   */

  cdb.Utils.genRandomPass = function(length) {

    function getRandomNum() {
      // between 0 - 1
      var rndNum = Math.random()
      // rndNum from 0 - 1000
      rndNum = parseInt(rndNum * 1000);
      // rndNum from 33 - 127
      rndNum = (rndNum % 94) + 33;
      return rndNum;
    }

    function checkPunc(num) {
      if ((num >=33) && (num <=47)) { return true; }
      if ((num >=58) && (num <=64)) { return true; }
      if ((num >=91) && (num <=96)) { return true; }
      if ((num >=123) && (num <=126)) { return true; }
      return false;
    }

    length = isNaN(length) ? "" : length
    var pass = "";
    var randomLength = !length ? true : false;

    if (randomLength) {
      length = Math.random();
      length = parseInt(length * 100);
      length = (length % 7) + 6
    }

    for (i=0; i < length; i++) {
      numI = getRandomNum();
      while (checkPunc(numI)) { numI = getRandomNum() }
      pass = pass + String.fromCharCode(numI);
    }

    return pass;
  }


  /**
   *  Add leading zeros to numbers
   *
   */
  cdb.Utils.pad = function(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
  }


  /**
   *  Remove all non-common characters like
   *  spaces, quotes, accents, etc...
   *
   */
  cdb.Utils.sanitizeString = function(str) {
    return str.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
  }

  /**
   *  Convert long numbers to
   *  readizable numbers.
   *
   */
  cdb.Utils.readizableNumber = function(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'G';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  }

  /**
   *  Get the extension of a string
   *
   */
  cdb.Utils.getFileExtension = function(str) {
    if (!str) return '';

    return str.substr(str.lastIndexOf('.') + 1);
  }


  /**
   *  Get ordinal string from a number
   *
   */
  cdb.Utils.getGetOrdinal = function(n) {
    if (!n) {
      return '';
    }
    var s = ["th","st","nd","rd"];
    var v = n%100;
    return n+(s[(v-20)%10]||s[v]||s[0]);
  }

  cdb.Utils.capitalize = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  cdb.Utils.isValidEmail = function(str) {
    var re = /^([^@]+)@([^@]+)\.([^@\.]+)$/i;
    return re.test(str);
  }

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
  cdb.Utils.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.apply(object, Array.prototype.slice.call(arguments, 2)) : value;
  };

  /*
   * Returns a (double) quoted table name if needed (if it contains a dash, for example).
   * Coupled to backend lib/carto/table_utils.rb#safe_table_name_quoting.
   * Duplicated at lib/assets/javascripts/builder/helpers/utils.js to make it available for older models.
   */
  cdb.Utils.safeTableNameQuoting = function (table_name) {
    if (table_name === undefined || table_name.indexOf('-') === -1 || table_name[0] === '"' || table_name[table_name.length - 1] === '"') {
      return table_name;
    } else {
      return '"' + table_name + '"';
    }
  };
