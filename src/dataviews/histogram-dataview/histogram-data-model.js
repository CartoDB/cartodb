var _ = require('underscore');
var BackboneAbortSync = require('../../util/backbone-abort-sync');
var Model = require('../../core/model');

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
    }
    if (this.get('bins')) {
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
    console.log('Datamodel initialize. Column type: ' + this.get('column_type'));
    this.sync = BackboneAbortSync.bind(this);
    this.bind('change:url change:bins change:aggregation', function () {
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
    this.set('bins', bins, { silent: bins !== void 0 });
  },

  setColumnType: function (columnType) {
    this.set('column_type', columnType);
  },

  setAggregation: function (aggregation) {
    this.set('aggregation', aggregation, { silent: aggregation !== void 0 });
  },

  getData: function () {
    return this.get('data');
  },

  parse: function (d) {
    var numberOfBins = d.bins_count;
    var width = d.bin_width;
    var start = d.bins_start;

    var buckets = new Array(numberOfBins);

    _.each(d.bins, function (b) {
      buckets[b.bin] = b;
    });

    for (var i = 0; i < numberOfBins; i++) {
      buckets[i] = _.extend({
        bin: i,
        start: start + (i * width),
        end: start + ((i + 1) * width),
        freq: 0
      }, buckets[i]);
    }

    return {
      data: buckets,
      start: buckets[0].start,
      end: buckets[buckets.length - 1].end,
      bins: numberOfBins
    };
  }
});
