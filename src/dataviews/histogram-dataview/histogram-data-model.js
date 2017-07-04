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
    if (this.get('aggregation')) {
      params.push('aggregation=' + this.get('aggregation'));
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

    this.bind('change:aggregation change:bins', function () {
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

  setAggregation: function (aggregation) {
    this.set('aggregation', aggregation, { silent: aggregation === void 0 });
  },

  getData: function () {
    return this.get('data');
  },

  parse: function (data) {
    var numberOfBins = data.bins_count;
    var width = data.bin_width;
    var start = data.bins_start;
    var buckets = new Array(numberOfBins);

    _.each(data.bins, function (bin) {
      buckets[bin.bin] = bin;
    });

    this.set('aggregation', data.aggregation, { silent: true });

    _.has(data, 'aggregation') ? this.fillTimestampBuckets(buckets, start, data.aggregation, numberOfBins) : this.fillNumericBuckets(buckets, start, width, numberOfBins);

    return {
      aggregation: data.aggregation,
      data: buckets,
      start: buckets[0].start,
      end: buckets[buckets.length - 1].end,
      bins: numberOfBins
    };
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
        freq: 0
      }, buckets[i]);
    }
  }
});
