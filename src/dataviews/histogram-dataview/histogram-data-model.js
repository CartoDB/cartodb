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
    var start = this.get('start');
    var end = this.get('end');

    if (columnType === 'number' && this.get('bins')) {
      params.push('bins=' + this.get('bins'));
    } else if (columnType === 'date') {
      params.push('aggregation=' + (this.get('aggregation') || 'auto'));
      if (_.isFinite(offset)) {
        params.push('offset=' + offset);
      }
    }

    var dataRange = this._getStartEnd(columnType, this.get('aggregation'));
    if (dataRange !== null) {
      params.push('start=' + dataRange.start);
      params.push('end=' + dataRange.end);
      //console.log('fetching totals with start end (', dataRange.start, ' - ', dataRange.end, ')');
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
      date: {}
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
      helper.fillTimestampBuckets(parsedData.data, start, aggregation, numberOfBins, this._getCurrentOffset());
    } else {
      helper.fillNumericBuckets(parsedData.data, start, width, numberOfBins);
    }

    if (parsedData.data.length > 0) {
      parsedData.start = parsedData.data[0].start;
      parsedData.end = parsedData.data[parsedData.data.length - 1].end;
    }
    this._saveStartEnd(this.get('column_type'), parsedData.aggregation, parsedData.start, parsedData.end);

    return parsedData;
  },

  _getCurrentOffset: function () {
    return this.get('localTimezone')
      ? this.get('localOffset')
      : this.get('offset');
  },

  _getStartEnd: function (columnType, aggregation) {
    var result = null;
    if (columnType === 'number' && this._startEndCache[columnType] !== null) {
      result = this._startEndCache[columnType];
    } else if (columnType === 'date') {
      var aggCache = this._startEndCache[columnType][aggregation];
      if (aggCache) {
        result = this._startEndCache[columnType][aggregation];
      }
    }
    return result;
  },

  _saveStartEnd: function (columnType, aggregation, start, end) {
    if (columnType === 'number' && this._startEndCache[columnType] === null) {
      this._startEndCache[columnType] = {
        start: start,
        end: end
      };
      //console.log('saved number ', start, ' - ', end);
    } else if (columnType === 'date') {
      var aggCache = this._startEndCache[columnType][aggregation];
      if (!aggCache) {
        this._startEndCache[columnType][aggregation] = {
          start: start,
          end: end
        };
        //console.log('saved date ', aggregation, ' ', start, ' - ', end);
      }
    }
  }
});
