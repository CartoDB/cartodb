var _ = require('underscore');
var BackboneAbortSync = require('../../util/backbone-abort-sync');
var Model = require('../../core/model');
var helper = require('../helpers/histogram-helper');

var DEFAULT_MAX_BUCKETS = 366;

/**
 *  This model is used for getting the total amount of data
 *  from the histogram widget (without any filter).
 */

module.exports = Model.extend({
  defaults: {
    url: '',
    data: []
  },

  url: function () {
    var params = [];
    var aggregation = this.get('aggregation');
    var offset = this.get('offset');

    if (this.get('column_type') === 'date' && (aggregation || offset)) {
      if (aggregation) {
        params.push('aggregation=' + aggregation);
      }

      if (offset) {
        params.push('offset=' + offset);
      }
    } else if (this.get('bins')) {
      params.push('bins=' + this.get('bins'));
    }
    if (this.get('apiKey')) {
      params.push('api_key=' + this.get('apiKey'));
    } else if (this.get('authToken')) {
      var authToken = this.get('authToken');
      if (authToken instanceof Array) {
        _.each(authToken, function (token) {
          params.push('auth_token[]=' + token);
        });
      } else {
        params.push('auth_token=' + authToken);
      }
    }
    return this.get('url') + '?' + params.join('&');
  },

  initialize: function () {
    this.sync = BackboneAbortSync.bind(this);
    this.on('change:url', function () {
      this.fetch();
    }, this);

    this.bind('change:offset change:aggregation change:bins', function () {
      if (this.hasChanged('bins') && this.get('aggregation')) return;
      this.fetch();
    }, this);
  },

  setUrl: function (url) {
    if (!url) {
      throw new Error('url not specified');
    }
    this.set('url', url);
  },

  setBins: function (bins) {
    this.set('bins', bins, { silent: bins === void 0 });
  },

  getData: function () {
    return this.get('data');
  },

  parse: function (data) {
    var aggregation = data.aggregation;
    var numberOfBins = data.bins_count;
    var width = data.bin_width;
    var start = this.get('column_type') === 'date' ? helper.calculateStart(data.bins, data.bins_start, aggregation) : data.bins_start;
    var offset = data.offset;

    var parsedData = {
      offset: offset,
      aggregation: aggregation,
      bins: numberOfBins,
      data: new Array(numberOfBins)
    };

    _.each(data.bins, function (bin) {
      parsedData.data[bin.bin] = bin;
    });

    this.set('aggregation', aggregation, { silent: true });

    if (numberOfBins > DEFAULT_MAX_BUCKETS) {
      parsedData.error = 'Max bins limit reached';
      return parsedData;
    }

    parsedData.error = undefined;
    if (this.get('column_type') === 'date') {
      helper.fillTimestampBuckets(parsedData.data, start, aggregation, numberOfBins, offset);
    } else {
      helper.fillNumericBuckets(parsedData.data, start, width, numberOfBins);
    }

    if (parsedData.data.length > 0) {
      parsedData.start = parsedData.data[0].start;
      parsedData.end = parsedData.data[parsedData.data.length - 1].end;
    }

    return parsedData;
  }
});
