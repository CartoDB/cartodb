var _ = require('underscore');
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
    var params = [
      'bins=' + this.get('bins')
    ];
    if (this.get('apiKey')) {
      params.push('api_key=' + this.get('apiKey'));
    }
    return this.get('url') + '?' + params.join('&');
  },

  initialize: function () {
    this.bind('change:url change:bins', function () {
      this.fetch();
    }, this);
  },

  setUrl: function (url) {
    if (!url) {
      throw new Error('url not specified');
    }
    this.set('url', url);
  },

  setBins: function (num) {
    if (!num) {
      throw new Error('bins not specified');
    }
    this.set('bins', num);
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
