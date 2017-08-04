var _ = require('underscore');
var Backbone = require('backbone');
var DataviewModelBase = require('./dataview-model-base');
var HistogramDataModel = require('./histogram-dataview/histogram-data-model');
var helper = require('./helpers/histogram-helper');
var d3 = require('d3');

module.exports = DataviewModelBase.extend({

  defaults: _.extend(
    {
      type: 'histogram',
      totalAmount: 0,
      filteredAmount: 0,
      hasNulls: false
    },
    DataviewModelBase.prototype.defaults
  ),

  _getDataviewSpecificURLParams: function () {
    var params = [];
    var start = this.get('start');
    var end = this.get('end');

    if (_.isNumber(this.get('own_filter'))) {
      params.push('own_filter=' + this.get('own_filter'));
    } else {
      var offset = this.get('offset');

      if (this.get('column_type') === 'number' && this.get('bins')) {
        params.push('bins=' + this.get('bins'));
      } else if (this.get('column_type') === 'date') {
        params.push('aggregation=' + (this.get('aggregation') || 'auto'));
        if (_.isFinite(offset)) {
          params.push('offset=' + offset);
        }
      }
      if (_.isNumber(start)) {
        params.push('start=' + start);
      }
      if (_.isNumber(end)) {
        params.push('end=' + end);
      }
    }
    return params;
  },

  initialize: function (attrs, opts) {
    // Internal model for calculating all the data in the histogram (without filters)
    this._originalData = new HistogramDataModel({
      bins: this.get('bins'),
      aggregation: this.get('aggregation'),
      offset: this.get('offset'),
      column_type: this.get('column_type'),
      apiKey: this.get('apiKey'),
      authToken: this.get('authToken')
    });

    DataviewModelBase.prototype.initialize.apply(this, arguments);
    this._data = new Backbone.Collection(this.get('data'));

    if (attrs && (attrs.min || attrs.max)) {
      this.filter.setRange(this.get('min'), this.get('max'));
    }
  },

  _initBinds: function () {
    DataviewModelBase.prototype._initBinds.apply(this);

    this._updateURLBinding();

    // When original data gets fetched
    this._originalData.bind('change:data', this._onDataChanged, this);
    this._originalData.once('change:data', this._updateBindings, this);

    this.on('change:column', this._onColumnChanged, this);
    this.on('change', this._onFieldsChanged, this);

    this.listenTo(this.layer, 'change:meta', this._onChangeLayerMeta);
  },

  _updateURLBinding: function () {
    // We shouldn't listen url change for fetching the data (with filter) because
    // we have to wait until we know all the data available (without any filter).
    this.off('change:url');
    this.on('change:url', this._onUrlChanged, this);
  },

  _updateBindings: function () {
    this._onChangeBinds();
    this._updateURLBinding();
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

  getUnfilteredData: function () {
    return this._originalData.get('data');
  },

  getUnfilteredDataModel: function () {
    return this._originalData;
  },

  getSize: function () {
    return this._data.size();
  },

  getColumnType: function () {
    return this.get('column_type');
  },

  hasNulls: function () {
    return this.get('hasNulls');
  },

  parse: function (data) {
    var aggregation = data.aggregation;
    var offset = data.offset;
    var numberOfBins = data.bins_count;
    var width = data.bin_width;
    var start = this.get('column_type') === 'date' ? helper.calculateStart(data.bins, data.bins_start, aggregation) : data.bins_start;

    var parsedData = {
      data: [],
      filteredAmount: 0,
      nulls: 0,
      totalAmount: 0
    };

    if (this.has('error')) {
      return parsedData;
    }

    parsedData.data = new Array(numberOfBins);

    _.each(data.bins, function (bin) {
      parsedData.data[bin.bin] = bin;
    });

    this.set({
      aggregation: aggregation,
      offset: offset
    }, { silent: true });

    if (this.get('column_type') === 'date') {
      helper.fillTimestampBuckets(parsedData.data, start, aggregation, numberOfBins, offset);
    } else {
      helper.fillNumericBuckets(parsedData.data, start, width, numberOfBins);
    }

    // FIXME - Update the end of last bin due https://github.com/CartoDB/cartodb.js/issues/926
    var lastBucket = parsedData.data[numberOfBins - 1];
    if (lastBucket && lastBucket.end < lastBucket.max) {
      lastBucket.end = lastBucket.max;
    }

    // if parse option is passed in the constructor, this._data is not created yet at this point
    this._data && this._data.reset(parsedData.data);

    // Calculate totals
    parsedData.totalAmount = this._calculateTotalAmount(parsedData.data);
    parsedData.filteredAmount = this._calculateFilteredAmount(this.filter, this._data);
    parsedData.nulls = data.nulls;

    if (data.nulls != null) {
      parsedData = _.extend({}, parsedData, {
        nulls: data.nulls,
        hasNulls: true
      });
    }

    return parsedData;
  },

  _onFilterChanged: function (filter) {
    this.set('filteredAmount', this._calculateFilteredAmount(filter, this._data));

    DataviewModelBase.prototype._onFilterChanged.apply(this, arguments);
  },

  _onColumnChanged: function () {
    this._originalData.set('column_type', this.get('column_type'));

    this.set({
      aggregation: undefined
    }, { silent: true });

    this._reloadVisAndForceFetch();
  },

  _calculateTotalAmount: function (buckets) {
    return _.reduce(buckets, function (memo, bucket) {
      var add = bucket && bucket.freq
        ? bucket.freq
        : 0;
      return memo + add;
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
    var columnType = this.get('column_type');
    var offset = this.get('offset');

    var options = {
      column: this.get('column')
    };

    if (columnType === 'number' && this.get('bins')) {
      options.bins = this.get('bins');
    } else if (columnType === 'date') {
      options.aggregation = this.get('aggregation') || 'auto';

      if (_.isFinite(offset)) {
        options.offset = offset;
      }
    }

    return {
      type: 'histogram',
      source: { id: this.getSourceId() },
      options: options
    };
  },

  _onChangeLayerMeta: function () {
    this.filter.set('column_type', this.layer.get('meta').column_type);
  },

  _onChangeBinds: function () {
    DataviewModelBase.prototype._onChangeBinds.call(this);
  },

  _onUrlChanged: function () {
    this._originalData.set({
      aggregation: this.get('aggregation'),
      offset: this.get('offset'),
      bins: this.get('bins')
    }, { silent: true });

    this._originalData.setUrl(this.get('url'));
  },

  _onDataChanged: function (model) {
    this.set({
      end: model.get('end'),
      start: model.get('start')
    });

    this.set({
      aggregation: model.get('aggregation') || 'minute',
      offset: model.get('offset') || 0,
      bins: model.get('bins'),
      error: model.get('error')
    }, { silent: true });

    var resetFilter = false;

    if (this.get('column_type') === 'date' && (_.has(this.changed, 'aggregation') || _.has(this.changed, 'offset'))) {
      resetFilter = true;
    } else if (this.get('column_type') === 'number' && _.has(this.changed, 'bins')) {
      resetFilter = true;
    }

    resetFilter
      ? this._resetFilterAndFetch()
      : this.fetch();
  },

  _onFieldsChanged: function () {
    if (!helper.hasChangedSomeOf(['offset', 'bins', 'aggregation'], this.changed)) {
      return;
    }

    if (this.get('column_type') === 'number') {
      this._originalData.set('bins', this.get('bins'));
    }
    if (this.get('column_type') === 'date') {
      this._originalData.set({
        offset: this.get('offset'),
        aggregation: this.get('aggregation')
      });
    }
  },

  _resetFilterAndFetch: function () {
    this._resetFilter();
    this.fetch();
  },

  _resetFilter: function () {
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
      'max',
      'aggregation',
      'offset'
    ])
  }
);
