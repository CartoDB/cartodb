var _ = require('underscore');
var BackboneAbortSync = require('../../util/backbone-abort-sync');
var Model = require('../../core/model');
var helper = require('../helpers/histogram-helper');

/**
 *  This model is used for getting the total amount of data
 *  from the histogram widget (without any filter).
 */

module.exports = Model.extend({
  defaults: {
    url: '',
    data: [],
    localTimezone: false,
    localOffset: 0,
    hasBeenFetched: false
  },

  url: function () {
    var params = [];
    var columnType = this.get('column_type');
    var offset = this._getCurrentOffset();
    var aggregation = this.get('aggregation') || 'auto';

    params.push('no_filters=1');

    if (columnType === 'number' && this.get('bins')) {
      params.push('bins=' + this.get('bins'));
    } else if (columnType === 'date') {
      params.push('aggregation=' + aggregation);
      if (_.isFinite(offset)) {
        params.push('offset=' + offset);
      }
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

    // Start - End
    var start = this.get('start');
    var end = this.get('end');
    if (_.isFinite(start) && _.isFinite(end)) {
      params.push('start=' + start);
      params.push('end=' + end);
    }

    return this.get('url') + '?' + params.join('&');
  },

  initialize: function () {
    this.sync = BackboneAbortSync.bind(this);
    this._initBinds();
  },

  _initBinds: function () {
    this.on('change:url', function () {
      this.refresh();
    }, this);

    this.on('change:aggregation change:offset', function () {
      if (this.get('column_type') === 'date' && this.get('aggregation')) {
        this.refresh();
      }
    }, this);

    this.on('change:bins', function () {
      if (this.get('column_type') === 'number') {
        this.refresh();
      }
    }, this);

    this.on('change:localTimezone', function () {
      this.refresh();
    }, this);

    this.on('change:column', function () {
      this.set('aggregation', 'auto', { silent: true });
    });

    this.on('sync', function () {
      this.set('hasBeenFetched', true);
    });
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
    var aggregation = data.aggregation || this.get('aggregation');
    var numberOfBins = data.bins_count || 0;
    var width = data.bin_width;
    var start = this.get('column_type') === 'date' ? data.timestamp_start : data.bins_start;

    var parsedData = {};
    parsedData.data = new Array(numberOfBins);

    if (aggregation) {
      parsedData.aggregation = aggregation;
      this.set('aggregation', aggregation, { silent: true });
    }

    _.each(data.bins, function (bin) {
      parsedData.data[bin.bin] = bin;
    });

    if (this.get('column_type') === 'date') {
      parsedData.data = helper.fillTimestampBuckets(parsedData.data, start, aggregation, numberOfBins, 'totals');
      numberOfBins = parsedData.data.length;
    } else {
      helper.fillNumericBuckets(parsedData.data, start, width, numberOfBins);
    }

    if (parsedData.data.length > 0) {
      parsedData.start = parsedData.data[0].start;
      parsedData.end = parsedData.data[parsedData.data.length - 1].end;
    }

    parsedData.bins = numberOfBins;

    return parsedData;
  },

  refresh: function () {
    this.fetch();
  },

  _getCurrentOffset: function () {
    return this.get('localTimezone')
      ? this.get('localOffset')
      : this.get('offset');
  }
});
