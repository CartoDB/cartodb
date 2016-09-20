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

var i = 0;
var MAX_URL_LENGTH = 2033;
var COMPRESSION_LEVEL = 3;

/**
 * Windshaft client. It provides a method to create instances of maps in Windshaft.
 * @param {object} options Options to set up the client
 */
var WindshaftClient = function (options) {
  validatePresenceOfOptions(options, ['urlTemplate', 'userName', 'endpoints']);

  this.urlTemplate = options.urlTemplate;
  this.userName = options.userName;
  this.endpoints = options.endpoints;
  this.statTag = options.statTag;

  this.url = this.urlTemplate.replace('{user}', this.userName);
};

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
          data.metadata.legends = [
            // Available legends for the first layer
            [
              {
                type: 'bubble',
                bubbles: [
                  10,
                  30,
                  50
                ],
                avg: 20
              },
              {
                type: 'category',
                categories: [
                  { name: 'Category1', color: '#FFFFAA' },
                  { name: 'Category2', color: '#FABADA' },
                  { name: 'Category3', color: '#CACACA' }
                ]
              },
              {
                type: 'choropleth',
                colors: [
                  '#FABADA',
                  '#CACACA',
                  '#CDCDCD'
                ]
              }
            ],
            [
              {
                type: 'category',
                categories: [
                  { name: 'Category1', color: '#FFFFAA' },
                  { name: 'Category3', color: '#CACACA' }
                ]
              }
            ]
          ];
        
        var choropleths = {
          'line-color': true,
          'marker-fill': true,
          'polygon-fill': true
        };
        function getLegendType(rule) {
          if (rule.mapping === '=') {
            return 'category';
          }
          
          if (choropleths.hasOwnProperty(rule.prop)) {
            return 'choropleth';
          }

          if (rule.prop === 'marker-width') {
            return 'bubble';
          }

          return null;
        }

        data.metadata.legends = data.metadata.layers.map(function(layerMeta) {
          return layerMeta.meta.cartocss_meta.rules.reduce(function(legends, rule) {
            var legendType = getLegendType(rule);
            if (legendType !== null) {
              var legend = {
                type: legendType,
              };
              if (legendType === 'category') {
                // I would change from color to a generic "value" key
                legend.categories = rule.filters.map(function(filter, index) {
                  return { name: filter, color: rule.values[index] };
                });
                // Default value is the color for "Others" category
                if (rule['default-value']) {
                  legend.categories = legend.categories.concat([{name: 'Others', color: rule['default-value']}]);
                }
              } else if (legendType === 'bubble') {
                legend.bubbles = rule.values;
                // legend.bubbles = rule.filters.map(function(filter, index) {
                //   return { label: filter, value: rule.values[index] };
                // });

                var stats = rule.stats;
                legend.avg = stats.avg_value / (stats.max_value - stats.min_value)
                // legend.min_value = stats.min_value;
                // legend.max_value = stats.max_value;
                // legend.avg_value = stats.avg_value;
              } else if (legendType === 'choropleth') {
                legend.colors = rule.values;
                // legend.choropleth = rule.filters.map(function(filter, index) {
                //   return { label: filter, value: rule.values[index] };
                // });
                // legend.min_value = stats.min_value;
                // legend.max_value = stats.max_value;
                // legend.avg_value = stats.avg_value;
              }
              legends.push(legend);
            };

            return legends;
          }, []);
        });

        // append fake legends as if the Maps API were returning this
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
  if (this._isURLValid(encodedURL)) {
    this._get(encodedURL, ajaxOptions);
  } else {
    this._generateCompressedURL(mapDefinition, params, function (compressedURL) {
      if (this._isURLValid(compressedURL)) {
        this._get(compressedURL, ajaxOptions);
      } else {
        var url = this._getURL(params, 'post');
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

  LZMA.compress(data, COMPRESSION_LEVEL, function (compressedPayload) {
    params = _.extend({
      lzma: util.array2hex(compressedPayload)
    }, params);

    callback(this._getURL(params));
  }.bind(this));
};

WindshaftClient.prototype._isURLValid = function (url) {
  return url.length < MAX_URL_LENGTH;
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

WindshaftClient.prototype._getURL = function (params, method) {
  method = method || 'get';
  var queryString = this._convertParamsToQueryString(params);
  var endpoint = this.endpoints[method];
  return [this.url, endpoint].join('/') + queryString;
};

WindshaftClient.prototype._convertParamsToQueryString = function (params) {
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
  return queryString.length > 0 ? '?' + queryString.join('&') : '';
};

WindshaftClient.prototype._jsonpCallbackName = function (payload) {
  return '_cdbc_' + util.uniqueCallbackName(payload);
};

module.exports = WindshaftClient;
