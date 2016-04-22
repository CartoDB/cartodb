var _ = require('underscore');
var Backbone = require('backbone');
var DataviewModelBase = require('./dataview-model-base');
var HistogramDataModel = require('./histogram-dataview/histogram-data-model');

module.exports = DataviewModelBase.extend({

  defaults: _.extend(
    {
      type: 'histogram',
      bins: 10
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
      if (_.isNumber(this.get('bins'))) {
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
      apiKey: this.get('apiKey')
    });

    this._unfilteredData.bind('change:data', function (mdl, data) {
      this.set({
        start: mdl.get('start'),
        end: mdl.get('end'),
        bins: mdl.get('bins')
      }, { silent: true });
      this._onChangeBinds();
    }, this);

    this.once('change:url', function () {
      this._unfilteredData.setUrl(this.get('url'));
    }, this);

    this.listenTo(this.layer, 'change:meta', this._onChangeLayerMeta);
    this.on('change:column', this._reloadMapAndForceFetch, this);
    this.on('change:bins change:start change:end', this._fetchAndResetFilter, this);
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

    this._data.reset(buckets);

    return {
      data: buckets,
      nulls: data.nulls
    };
  },

  toJSON: function (d) {
    return {
      type: 'histogram',
      source: { id: this._getSourceId() },
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
    this.bind('change:autoStyle', function (mdl, isAutoStyle, d) {
      if (isAutoStyle) {
        this.trigger('autoStyle', this);
      }
    }, this);
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
      'bins'
    ])
  }
);
