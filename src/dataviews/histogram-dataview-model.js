var _ = require('underscore');
var Backbone = require('backbone');
var DataviewModelBase = require('./dataview-model-base');

module.exports = DataviewModelBase.extend({

  defaults: _.extend(
    {
      type: 'histogram',
      bins: 10
    },
    DataviewModelBase.prototype.defaults
  ),

  url: function () {
    var params = [];

    if (this.get('submitBBox')) {
      params.push('bbox=' + this._getBoundingBoxFilterParam());
    }
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
    var url = this.get('url');
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    return url;
  },

  initialize: function (attrs, opts) {
    DataviewModelBase.prototype.initialize.apply(this, arguments);
    this._data = new Backbone.Collection(this.get('data'));

    // BBox should only be included until after the first fetch, since we want to get the range of the full dataset
    this.once('change:data', function () {
      this.set('submitBBox', true);

      var data = this.getData();
      if (data && data.length > 0) {
        this.set({
          start: data[0].start,
          end: data[data.length - 1].end,
          bins: data.length
        }, { silent: true });
      }
    }, this);
    this.listenTo(this.layer, 'change:meta', this._onChangeLayerMeta);
    this.on('change:column', this._reloadMapAndForceFetch, this);
    this.on('change:bins change:start change:end', this._fetchAndResetFilter, this);
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
    this.bind('change:histogram_sizes', function (mdl, isSizesApplied, d) {
      if (isSizesApplied) {
        this.trigger('histogram_sizes', this);
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
