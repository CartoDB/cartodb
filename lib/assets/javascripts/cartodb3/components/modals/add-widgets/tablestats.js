var QuerySchemaModel = require('../../../data/query-schema-model');
var _ = require('underscore');

function TableStats (opts) {
  if (opts.user && opts.api_key) {
    this.user = opts.username;
    this.api_key = opts.api_key;
  } else if (opts.configModel) {
    this.configModel = opts.configModel;
  }
  this.tables = {};
  this.queue = {};
}

TableStats.prototype = {

  graphFor: function (tableName, column, callback) {
    this._getPgStats(tableName, function (stats) {
      var graph = new ColumnGraph(stats[column]);
      callback(graph);
    });
  },

  _getPgStats: function (table, callback) {
    var self = this;
    if (this.tables[table]) {
      if (!_.isEmpty(this.tables[table])) {
        callback(this.tables[table]);
      } else {
        this.queue[table].push(callback);
      }
    } else {
      this.tables[table] = {};
      this.queue[table] = [callback];
      var schemaModel = new QuerySchemaModel(null, {
        configModel: this.configModel
      });
      schemaModel.set('query', 'with a as (select reltuples from pg_class where relname = \'' + table + '\'), b as (select * from pg_stats where tablename = \'' + table + '\') select * from a,b');
      schemaModel.on('change:status', function (model, status) {
        if (status === 'fetched') {
          var rows = schemaModel.rowsSampleCollection.map(function (m) { return m.attributes; }).map(function (r) {
            var count = r.reltuples;
            var bounds = self._reformatToJSON(r.histogram_bounds);
            if (bounds) {
              var avgs = bounds.reduce(function (p, c, i) {
                if (i < bounds.length - 1) {
                  p.push((bounds[i + 1] + c) / 2);
                }
                return p;
              }, []);
              var binsize = count / (bounds.length - 1);
              var sum = avgs.reduce(function (p, c) {
                return p + c * binsize;
              }, 0);
              var average = sum / count;
              var min = bounds[0];
              var max = _.last(bounds);
            }
            return {
              column: r.attname,
              histogram_bounds: bounds,
              freqs: r.most_common_freqs,
              mostcommon: self._reformatToJSON(r.most_common_vals),
              nulls: r.null_frac,
              count: count,
              sum: sum,
              min: min,
              max: max,
              avg: average
            };
          });

          var stats = rows.reduce(function (p, c) {
            var column = c.column;
            delete c.column;
            p[column] = c;
            return p;
          }, {});
          self.tables[table] = stats;
          self._processQueue(table);
        }
      }, this);
      schemaModel.fetch();
    }
  },

  _processQueue: function (table) {
    var self = this;
    this.queue[table].forEach(function (callback) {
      callback(self.tables[table]);
    });
  },

  _reformatToJSON: function (sqlData) {
    if (!sqlData) return null;
    sqlData = sqlData.replace('{', '').replace('}', '').split(',');
    if (!sqlData.some(isNaN)) {
      sqlData = sqlData.map(function (n) {
        return parseInt(n, 10);
      });
    }
    return sqlData;
  }
};

function ColumnGraph (stats, options) {
  this.stats = stats;
}

ColumnGraph.prototype = {
  getNullsPercentage: function () {
    return this.stats.nulls;
  },

  getPercentageInTopCategories: function (topx) {
    return this.stats.freqs.slice(0, topx || 10).reduce(function (p, c) { return p + c; });
  },

  getHistogram: function (options) {
    return this._generateHistogram(options.width, options.height, options.color, options.bins);
  },

  getCategory: function (options) {
    return this._generateCategory(options.width, options.height, options.color);
  },

  getMin: function () {
    return this.stats.min;
  },

  getMax: function () {
    return this.stats.max;
  },

  getAverage: function () {
    return this.stats.avg;
  },

  getCount: function () {
    return this.stats.count;
  },

  getSum: function () {
    return this.stats.sum;
  },

  _generateCategory: function (width, height, color) {
    if (!this.stats.freqs) return;
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var proportion = this.getPercentageInTopCategories();
    canvas.height = height || 10;
    canvas.width = width || 400;
    var spacing = 2;
    var begin = spacing;
    var end = canvas.width - spacing * 2;
    var greenPosition = (end - begin) * proportion + begin;
    context.lineCap = 'round';
    context.strokeStyle = '#EDEDED';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(begin, canvas.height / 2);
    context.lineTo(end, canvas.height / 2);
    context.stroke();
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(begin, canvas.height / 2);
    context.lineTo(greenPosition, canvas.height / 2);
    context.stroke();
    return canvas;
  },

  _generateHistogram: function (width, height, color, bins) {
    var histogram;
    if (this.stats.histogram_bounds) {
      histogram = this._getHistogramFromBounds(bins);
    } else if (this.stats.freqs) {
      histogram = this._getHistogramFromFreqs(bins);
    } else return;

    bins = histogram.length;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.height = height || 90;
    canvas.width = width || 400;
    var barSeparation = 2;
    var barWidth = (canvas.width - barSeparation * (bins - 1)) / bins;
    context.strokeStyle = '#EDEDED';
    context.lineWidth = 1;

    // Guides

    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(canvas.width, 0);
    context.stroke();
    context.beginPath();
    context.moveTo(0, canvas.height / 2);
    context.lineTo(canvas.width, canvas.height / 2);
    context.stroke();

    // Bars

    histogram.forEach(function (bar, index) {
      var x = index * (barWidth + barSeparation);
      var barHeight = canvas.height * bar;
      context.beginPath();
      context.fillStyle = color;
      context.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    });

    // Base line

    context.strokeStyle = '#A1BBA7';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, canvas.height);
    context.lineTo(canvas.width, canvas.height);
    context.stroke();

    return canvas;
  },

  _getHistogramFromBounds: function (bins) {
    var bounds = this.stats.histogram_bounds;
    bounds = bounds.sort(function (a, b) { return a - b; });
    var min = bounds[0];
    var max = bounds[bounds.length - 1];
    var witdh = (max - min) / bins;

    function clamp (a, b, t) {
      return Math.max(a, Math.min(b, t));
    }

    function selectivity (bucket_number) {
      var low = min + bucket_number * witdh;
      var high = low + witdh;
      var i = 0;
      var s = 0;
      // calculate overlap
      for (i = 1; i < bounds.length; ++i) {
        var b_min = bounds[i - 1];
        var b_max = bounds[i];
        var l = clamp(b_min, b_max, low);
        var h = clamp(b_min, b_max, high);
        var span = Math.min(h - l, b_max - b_min);
        s += b_max === b_min ? 1.0 : span / (b_max - b_min);
      }
      return s / 100;
    }
    var buckets = [];

    for (var i = 0; i < bins; ++i) {
      buckets.push(selectivity(i));
    }
    return buckets;
  },

  _getHistogramFromFreqs: function (bins) {
    var values = this.stats.mostcommon;
    var freqs = this.stats.freqs;
    bins = Math.min(bins, values.length);
    var min = _.min(values);
    var max = _.max(values);
    var histogram = new Array(bins).fill(0);
    function scale (value) {
      if (max === min) return min;
      return (bins - 1) * (value - min) / (max - min);
    }
    values.forEach(function (v, i) {
      histogram[Math.floor(scale(v))] += freqs[i];
    });
    return histogram;
  }

};

module.exports = TableStats;
