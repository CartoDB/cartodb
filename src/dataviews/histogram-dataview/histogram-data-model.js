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
    data: [],
    localTimezone: false,
    localOffset: 0
  },

  url: function () {
    var params = [];
    var columnType = this.get('column_type');
    var offset = this._getCurrentOffset();

    if (columnType === 'number' && this.get('bins')) {
      params.push('bins=' + this.get('bins'));
    } else if (columnType === 'date') {
      params.push('aggregation=' + (this.get('aggregation') || 'auto'));
      if (_.isFinite(offset)) {
        params.push('offset=' + offset);
      }
    }

    // Start - End
    var limits = this.getCurrentStartEnd();
    if (limits !== null) {
      if (_.isNumber(limits.start)) {
        params.push('start=' + limits.start);
      }
      if (_.isNumber(limits.end)) {
        params.push('end=' + limits.end);
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
    return this.get('url') + '?' + params.join('&');
  },

  initialize: function () {
    this._startEndCache = {
      number: null,
      date: {},
      saved: false
    };
    this.sync = BackboneAbortSync.bind(this);
    this._initBinds();
  },

  _initBinds: function () {
    this.on('change:url', function () {
      this.fetch();
    }, this);

    this.on('change:aggregation change:offset', function () {
      if (this.get('column_type') === 'date' && this.get('aggregation')) {
        this.fetch();
      }
    }, this);

    this.on('change:bins', function () {
      if (this.get('column_type') === 'number' && _.isUndefined(this.get('aggregation'))) {
        this.fetch();
      }
    }, this);

    this.on('change:localTimezone', function () {
      this.fetch();
    }, this);

    this.on('change:column', function () {
      this._resetStartEndCache();
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
    var aggregation = data.aggregation;
    var numberOfBins = data.bins_count;
    var width = data.bin_width;
    var start = this.get('column_type') === 'date' ? data.timestamp_start : data.bins_start;

    var parsedData = {
      aggregation: aggregation,
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
      parsedData.data = helper.fillTimestampBuckets(parsedData.data, start, aggregation, numberOfBins, this._getCurrentOffset(), 'totals');
      numberOfBins = parsedData.data.length;
    } else {
      helper.fillNumericBuckets(parsedData.data, start, width, numberOfBins);
    }

    if (parsedData.data.length > 0) {
      // ESTO HABRÁ QUE QUITARLO Y CUIDADO CON NUMBER
      parsedData.start = parsedData.data[0].start;
      parsedData.end = parsedData.data[parsedData.data.length - 1].end;

      var limits = helper.calculateLimits(parsedData.data);
      this._saveStartEnd(this.get('column_type'), parsedData.aggregation, parsedData.start, parsedData.end, limits, data.offset);
    }

    parsedData.bins = numberOfBins;

    return parsedData;
  },

  _getCurrentOffset: function () {
    return this.get('localTimezone')
      ? this.get('localOffset')
      : this.get('offset');
  },

  getCurrentStartEnd: function () {
    var columnType = this.get('column_type');
    var aggregation = this.get('aggregation');

    if (columnType === 'number' && this._startEndCache[columnType] !== null) {
      return this._startEndCache[columnType];
    } else if (columnType === 'date') {
      var aggCache = this._startEndCache[columnType][aggregation];
      if (aggCache) {
        var result = this._startEndCache[columnType][aggregation];
        return {
          start: result.start,
          end: result.end
        };
      }
    }
    return null;
  },

  _saveStartEnd: function (columnType, aggregation, start, end, limits, offset) {
    if (this._startEndCache.saved) {
      return;
    }

    if (columnType === 'number' && this._startEndCache[columnType] === null) {
      this._startEndCache[columnType] = {
        start: start,
        end: end
      };
      this._startEndCache.saved = true;
    } else if (columnType === 'date') {
      var ranges = helper.calculateDateRanges(aggregation, limits.start, limits.end);
      this._startEndCache[columnType] = ranges;
      this._startEndCache.saved = true;
    }
  },

  _resetStartEndCache: function () {
    this._startEndCache.saved = false;
  }
});
