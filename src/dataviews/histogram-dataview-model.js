var _ = require('underscore');
var Backbone = require('backbone');
var DataviewModelBase = require('./dataview-model-base');
var HistogramDataModel = require('./histogram-dataview/histogram-data-model');
var d3 = require('d3');

module.exports = DataviewModelBase.extend({

  defaults: _.extend(
    {
      type: 'histogram',
      bins: 10,
      totalAmount: 0,
      filteredAmount: 0,
      hasNulls: false
    },
    DataviewModelBase.prototype.defaults
  ),

  _getDataviewSpecificURLParams: function () {
    var params = [];

    if (this.get('column_type')) {
      params.push('column_type=' + this.get('column_type'));
    }
    if (_.isNumber(this.get('own_filter'))) {
      params.push('own_filter=' + this.get('own_filter'));
    } else {
      if (_.isNumber(this.get('start'))) {
        params.push('start=' + this.get('start'));
      }
      if (_.isNumber(this.get('end'))) {
        params.push('end=' + this.get('end'));
      }
      if (_.isNumber(parseInt(this.get('bins'), 10))) {
        params.push('bins=' + this.get('bins'));
      }
    }
    return params;
  },

  initialize: function (attrs, opts) {
    DataviewModelBase.prototype.initialize.apply(this, arguments);
    this._data = new Backbone.Collection(this.get('data'));

    // Internal model for calculating all the data in the histogram (without filters)
    this._unfilteredData = new HistogramDataModel({
      bins: this.get('bins'),
      apiKey: this.get('apiKey'),
      authToken: this.get('authToken')
    });

    this._unfilteredData.bind('change:data', function (mdl, data) {
      this.set({
        start: mdl.get('start'),
        end: mdl.get('end'),
        bins: mdl.get('bins')
      }, { silent: true });
      this._onChangeBinds();
    }, this);

    this.on('change:url', function () {
      this._unfilteredData.setUrl(this.get('url'));
    }, this);

    this.listenTo(this.layer, 'change:meta', this._onChangeLayerMeta);
    this.on('change:column', this._reloadVisAndForceFetch, this);
    this.on('change:bins change:start change:end', this._fetchAndResetFilter, this);
    if (attrs && (attrs.min || attrs.max)) {
      this.filter.setRange(this.get('min'), this.get('max'));
    }
  },

  _initBinds: function () {
    DataviewModelBase.prototype._initBinds.apply(this);
    // We shouldn't listen url change for fetching the data (with filter) because
    // we have to wait until we know all the data available (without any filter).
    this.stopListening(this, 'change:url', null);
  },

  enableFilter: function () {
    this.set('own_filter', 1);
  },

  disableFilter: function () {
    this.unset('own_filter');
  },

  getData: function () {
    return this._data.toJSON();
  },

  getUnfilteredDataModel: function () {
    return this._unfilteredData;
  },

  getSize: function () {
    return this._data.size();
  },

  hasNulls: function () {
    return this.get('hasNulls');
  },

  parse: function (data) {
    var numberOfBins = data.bins_count;
    var width = data.bin_width;
    var start = data.bins_start;

    var buckets = new Array(numberOfBins);

    _.each(data.bins, function (b) {
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

    // FIXME - Update the end of last bin due https://github.com/CartoDB/cartodb.js/issues/926
    var lastBucket = buckets[numberOfBins - 1];
    if (lastBucket && lastBucket.end < lastBucket.max) {
      lastBucket.end = lastBucket.max;
    }

    // if parse option is passed in the constructor, this._data is not created yet at this point
    this._data && this._data.reset(buckets);

    // Calculate totals
    var totalAmount = this._calculateTotalAmount(buckets);
    var filteredAmount = this._calculateFilteredAmount(this.filter, this._data);

    var attrs = {
      data: buckets,
      totalAmount: totalAmount,
      filteredAmount: filteredAmount,
      hasNulls: false
    };

    if (data.nulls != null) {
      attrs = _.extend({}, attrs, {
        nulls: data.nulls,
        hasNulls: true
      });
    }

    return attrs;
  },

  _onFilterChanged: function (filter) {
    this.set('filteredAmount', this._calculateFilteredAmount(filter, this._data));

    DataviewModelBase.prototype._onFilterChanged.apply(this, arguments);
  },

  _calculateTotalAmount: function (buckets) {
    return _.reduce(buckets, function (memo, bucket) {
      return memo + bucket.freq;
    }, 0);
  },

  _calculateFilteredAmount: function (filter, data) {
    var filteredAmount = 0;
    if (filter && filter.get('min') !== void 0 && filter.get('max') !== void 0) {
      var indexes = this._findBinsIndexes(data, filter.get('min'), filter.get('max'));
      filteredAmount = this._sumBinsFreq(data, indexes.start, indexes.end);
    }

    return filteredAmount;
  },

  _findBinsIndexes: function (data, start, end) {
    var startBin = data.findWhere({ start: Math.min(start, end) });
    var endBin = data.findWhere({ end: Math.max(start, end) });

    return {
      start: startBin && startBin.get('bin'),
      end: endBin && endBin.get('bin')
    };
  },

  _sumBinsFreq: function (data, start, end) {
    return _.reduce(data.slice(start, end + 1), function (acum, d) {
      return (d.get('freq') || 0) + acum;
    }, 0);
  },

  /*
  Ported from cartodb-postgresql
  https://github.com/CartoDB/cartodb-postgresql/blob/master/scripts-available/CDB_DistType.sql
  */
  getDistributionType: function (data) {
    var histogram = data || this.get('data');
    var freqAccessor = function (a) { return a.freq; };
    var osc = d3.max(histogram, freqAccessor) - d3.min(histogram, freqAccessor);
    var mean = d3.mean(histogram, freqAccessor);
    // When the difference between the max and the min values is less than
    // 10 percent of the mean, it's a flat histogram (F)
    if (osc < mean * 0.1) return 'F';
    var sumFreqs = d3.sum(histogram, freqAccessor);
    var freqs = histogram.map(function (bin) {
      return 100 * bin.freq / sumFreqs;
    });

    // The ajus array represents relative growths
    var ajus = freqs.map(function (freq, index) {
      var next = freqs[index + 1];
      if (freq > next) return -1;
      if (Math.abs(freq - next) <= 0.05) return 0;
      return 1;
    });
    ajus.pop();
    var maxAjus = d3.max(ajus);
    var minAjus = d3.min(ajus);
    // If it never grows or shrinks, it returns flat
    if (minAjus === 0 && maxAjus === 0) return 'F';
    else if (maxAjus < 1) return 'L';
    else if (minAjus > -1) return 'J';
    else {
      var uniques = _.uniq(ajus);
      var A_TYPES = [[1, -1], [1, 0, -1], [1, -1, 0], [0, 1, -1]];
      var U_TYPES = [[-1, 1], [-1, 0, 1], [-1, 1, 0], [0, -1, 1]];
      if (A_TYPES.some(function (e) {
        return _.isEqual(e, uniques);
      })) return 'A';
      else if (U_TYPES.some(function (e) {
        return _.isEqual(e, uniques);
      })) return 'U';
      else return 'S';
    }
  },

  toJSON: function (d) {
    return {
      type: 'histogram',
      source: { id: this.getSourceId() },
      options: {
        column: this.get('column'),
        bins: this.get('bins')
      }
    };
  },

  _onChangeLayerMeta: function () {
    this.filter.set('column_type', this.layer.get('meta').column_type);
  },

  _onChangeBinds: function () {
    DataviewModelBase.prototype._onChangeBinds.call(this);
  },

  _fetchAndResetFilter: function () {
    this.fetch();
    this.disableFilter();
    this.filter.unsetRange();
  }
},

  // Class props
  {
    ATTRS_NAMES: DataviewModelBase.ATTRS_NAMES.concat([
      'column',
      'column_type',
      'bins',
      'min',
      'max'
    ])
  }
);
