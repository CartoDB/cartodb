var _ = require('underscore');
var moment = require('moment');
var BackboneAbortSync = require('../../util/backbone-abort-sync');
var Model = require('../../core/model');

var MOMENT_AGGREGATIONS = {
  day: 'd',
  hour: 'h',
  minute: 'm',
  month: 'M',
  quarter: 'Q',
  second: 's',
  week: 'w',
  year: 'y'
};

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

    if (this.get('column_type') === 'date' && aggregation) {
      params.push('aggregation=' + aggregation);

      if (this.get('timezone')) {
        params.push('timezone=' + this.get('timezone'));
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

    this.bind('change:timezone change:aggregation change:bins', function () {
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
    var start = data.bins_start;
    var width = data.bin_width;

    var parsedData = {
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
      this.fillTimestampBuckets(parsedData.data, start, aggregation, numberOfBins)
    } else {
      this.fillNumericBuckets(parsedData.data, start, width, numberOfBins);
    }

    if (parsedData.data.length > 0) {
      parsedData.start = parsedData.data[0].start;
      parsedData.end = parsedData.data[parsedData.data.length - 1].end;
    }

    return parsedData;
  },

  fillNumericBuckets: function (buckets, start, width, numberOfBins) {
    for (var i = 0; i < numberOfBins; i++) {
      buckets[i] = _.extend({
        bin: i,
        start: start + (i * width),
        end: start + ((i + 1) * width),
        freq: 0
      }, buckets[i]);
    }
  },

  fillTimestampBuckets: function (buckets, start, aggregation, numberOfBins) {
    var startDate = moment.unix(start).utc();

    for (var i = 0; i < numberOfBins; i++) {
      buckets[i] = _.extend({
        bin: i,
        start: startDate.clone().add(i, MOMENT_AGGREGATIONS[aggregation]).unix(),
        end: startDate.clone().add(i + 1, MOMENT_AGGREGATIONS[aggregation]).unix() - 1,
        next: startDate.clone().add(i + 1, MOMENT_AGGREGATIONS[aggregation]).unix(),
        freq: 0
      }, buckets[i]);
    }
  }
});
