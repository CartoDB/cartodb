var $ = require('jquery');
var _ = require('underscore');
var LZMA = require('lzma');
var util = require('../core/util');

var validatePresenceOfOptions = function (options, requiredOptions) {
  var missingOptions = _.filter(requiredOptions, function (option) {
    return !options[option];
  });
  if (missingOptions.length) {
    throw new Error('WindshaftClient could not be initialized. The following options are missing: ' + missingOptions.join(', '));
  }
};

/**
 * Windshaft client. It provides a method to create instances of maps in Windshaft.
 * @param {object} options Options to set up the client
 */
var WindshaftClient = function (options) {
  validatePresenceOfOptions(options, ['urlTemplate', 'userName', 'endpoint']);

  this.urlTemplate = options.urlTemplate;
  this.userName = options.userName;
  this.endpoint = options.endpoint;
  this.statTag = options.statTag;

  this.url = this.urlTemplate.replace('{user}', this.userName);
};

WindshaftClient.prototype.MAX_URL_LENGTH = 2033;
WindshaftClient.prototype.COMPRESSION_LEVEL = 3;

WindshaftClient.prototype.instantiateMap = function (options) {
  if (!options.mapDefinition) {
    throw new Error('mapDefinition option is required');
  }

  var mapDefinition = options.mapDefinition;
  var params = options.params || {};
  var successCallback = options.success;
  var errorCallback = options.error;

  var ajaxOptions = {
    success: function (data) {
      if (data.errors) {
        errorCallback(data);
      } else {
        successCallback(data);
      }
    },
    error: function (xhr, textStatus) {
      // Ignore error if request was explicitly aborted
      if (textStatus === 'abort') return;

      var errors = {};
      try {
        errors = JSON.parse(xhr.responseText);
      } catch (e) {}
      errorCallback(errors);
    }
  };

  var encodedURL = this._generateEncodedURL(mapDefinition, params);
  if (!this._isURLTooLong(encodedURL)) {
    this._get(encodedURL, ajaxOptions);
  } else {
    this._generateCompressedURL(mapDefinition, params, function (compressedURL) {
      if (!this._isURLTooLong(compressedURL)) {
        this._get(compressedURL, ajaxOptions);
      } else {
        var url = this._getURL(params);
        this._post(url, mapDefinition, ajaxOptions);
      }
    }.bind(this));
  }
};

WindshaftClient.prototype._generateEncodedURL = function (payload, params) {
  params = _.extend({
    config: JSON.stringify(payload)
  }, params);

  return this._getURL(params);
};

WindshaftClient.prototype._generateCompressedURL = function (payload, params, callback) {
  var data = JSON.stringify({
    config: JSON.stringify(payload)
  });

  LZMA.compress(data, this.COMPRESSION_LEVEL, function (compressedPayload) {
    params = _.extend({
      lzma: util.array2hex(compressedPayload)
    }, params);

    callback(this._getURL(params));
  }.bind(this));
};

WindshaftClient.prototype._isURLTooLong = function (url) {
  return url.length >= this.MAX_URL_LENGTH;
};

WindshaftClient.prototype._post = function (url, payload, options) {
  this._abortPreviousRequest();
  this._previousRequest = $.ajax({
    url: url,
    crossOrigin: true,
    method: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(payload),
    success: options.success,
    error: options.error
  });
};

WindshaftClient.prototype._get = function (url, options) {
  this._abortPreviousRequest();
  this._previousRequest = $.ajax({
    url: url,
    method: 'GET',
    dataType: 'jsonp',
    jsonpCallback: this._jsonpCallbackName(url),
    cache: true,
    success: options.success,
    error: options.error
  });
};

WindshaftClient.prototype._abortPreviousRequest = function () {
  if (this._previousRequest) {
    this._previousRequest.abort();
  }
};

WindshaftClient.prototype._getURL = function (params) {
  var queryString = [];
  _.each(params, function (value, name) {
    if (value instanceof Array) {
      _.each(value, function (one_value) {
        queryString.push(name + '[]=' + one_value);
      });
    } else if (value instanceof Object) {
      queryString.push(name + '=' + encodeURIComponent(JSON.stringify(value)));
    } else {
      queryString.push(name + '=' + encodeURIComponent(value));
    }
  });

  return [this.url, this.endpoint].join('/') + (queryString ? '?' + queryString.join('&') : '');
};

WindshaftClient.prototype._jsonpCallbackName = function (payload) {
  return '_cdbc_' + util.uniqueCallbackName(payload);
};

module.exports = WindshaftClient;
