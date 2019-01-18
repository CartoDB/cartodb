var CDB = require('internal-carto.js');
var _ = require('underscore');

function TableStats (opts) {
  if (opts.user && opts.api_key) {
    this.user = opts.username;
    this.api_key = opts.api_key;
  } else if (opts.configModel) {
    this.configModel = opts.configModel;
    this.userModel = opts.userModel;
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
    var userModel = this.userModel;
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

      var schema = userModel.getSchemaName();
      var sql = new CDB.SQL({
        user: this.configModel.get('user_name'),
        sql_api_template: this.configModel.get('sql_api_template'),
        api_key: this.configModel.get('api_key')
      });

      sql.execute(
        'with a as (select reltuples from pg_class where relname = \'' + table + '\'), b as (select * from pg_stats where tablename = \'' + table + '\' and schemaname = \'' + schema + '\') select * from a,b',
        null,
        {
          rows_per_page: 40,
          page: 0
        }
      ).done(function (data) {
        data = data || {};
        var rows = data.rows.map(function (r) {
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
          var mostCommon = self._reformatToJSON(r.most_common_vals);
          var trues;
          if (mostCommon) {
            var trueIndex = mostCommon.indexOf('t');
            var falseIndex = mostCommon.indexOf('f');
            if (trueIndex > -1 && falseIndex > -1) {
              trues = r.most_common_freqs[trueIndex];
            }
          }
          return {
            column: r.attname,
            histogram_bounds: bounds,
            freqs: r.most_common_freqs,
            mostcommon: mostCommon,
            nulls: r.null_frac,
            count: count,
            sum: sum,
            min: min,
            max: max,
            avg: average,
            trues: trues
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
      });
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
  options = options || {};
  this.stats = stats;
  this.normalize = typeof options.normalize === 'undefined' ? true : options.normalize;
}

ColumnGraph.prototype = {
  getNullsPercentage: function () {
    return this.stats.nulls;
  },

  getPercentageInTopCategories: function (topx) {
    return this.stats.freqs.slice(0, topx || 10).reduce(function (p, c) { return p + c; });
  },

  getTrues: function () {
    return this.stats.trues;
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
    var proportion;
    if (_.isNumber(this.getTrues())) {
      proportion = this.getTrues();
    } else {
      proportion = this.getPercentageInTopCategories();
    }
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

    if (_.isEmpty(this.stats)) {
      return;
    }

    if (this.stats.freqs && this.stats.freqs.length < 60) {
      histogram = this._getHistogramFromFreqs(bins);
    } else if (this.stats.histogram_bounds) {
      histogram = this._getHistogramFromBounds(bins);
    }

    if (!histogram || _.isEmpty(histogram)) {
      return;
    }

    if (this.normalize) {
      var max = _.max(histogram);
      histogram = histogram.map(function (bin) {
        return bin / max;
      });
    }

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
    var width = (max - min) / bins;
    var histogram = new Array(bins + 1).join('0').split('').map(parseFloat);
    function scaleBin (value) {
      if (max === min) return min;
      return Math.floor((bins - 1) * (value - min) / (max - min));
    }

    var boundProportion = 1 / (bounds.length - 1);
    for (var i = 0; i < bounds.length - 1; ++i) {
      var binMin = scaleBin(bounds[i]);
      var binMax = scaleBin(bounds[i + 1]);
      if (binMin === binMax) {
        histogram[binMin] += boundProportion;
      } else {
        var proportionForFirstBin = ((min + width * (binMin + 1)) - bounds[i]) / (bounds[i + 1] - bounds[i]);
        histogram[binMin] += proportionForFirstBin * boundProportion;
        var proportionForLastBin = (bounds[i + 1] - (min + width * (binMax))) / (bounds[i + 1] - bounds[i]);
        histogram[binMax] += proportionForLastBin * boundProportion;
        var remaining = boundProportion - proportionForFirstBin - proportionForLastBin;
        _.range(binMin + 1, binMax).forEach(function (binIndex, i, array) {
          histogram[binIndex] = remaining / array.length;
        });
      }
    }

    return histogram;
  },

  _getHistogramFromFreqs: function (bins) {
    var values = this.stats.mostcommon;
    var freqs = this.stats.freqs;
    bins = Math.min(bins, values.length);
    var min = _.min(values);
    var max = _.max(values);

    // If there is only one value, histogram should not be rendered
    if (min === max) {
      return [];
    }

    var histogram = new Array(bins + 1).join('0').split('').map(parseFloat);
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
