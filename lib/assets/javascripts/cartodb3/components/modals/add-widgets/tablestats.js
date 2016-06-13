var QuerySchemaModel = require('../../../data/query-schema-model');
var ConfigModel = require('../../../data/config-model');
var _ = require('underscore');

var configModel = new ConfigModel(
  _.defaults(
    {
      base_url: window.userData.base_url,
      api_key: window.userData.api_key
    },
    window.frontendConfig
  )
);

function TableStats (username, api_key) {
  this.user = username;
  this.apiKey = api_key;
  this.tables = {};
  this.queue = {};
  this.schemaModel = new QuerySchemaModel(null, {
    configModel: configModel
  });
}

TableStats.prototype = {

  graphFor: function (tableName, column, callback) {
    var self = this;
    this._getPgStats(tableName, function (stats) {
      var graph = new ColumnGraph(stats[column]);
      callback(graph);
    });
  },

  _getPgStats: function (table, callback) {
    var self = this;
    if (this.tables[table]) {
      if (!_.isEmpty(this.tables[table])){
        callback(this.tables[table])
      } else {
        this.queue[table].push(callback);
      }
    } else {
      this.tables[table] = {};
      this.queue[table] = [callback];
      this.schemaModel.set('query', 'select * from pg_stats where tablename = \'' + table + '\'');
      this.schemaModel.on('change:status', function (model, status) {
        if (status === 'fetched') {
          var rows = this.schemaModel.rowsSampleCollection.map(function (m) {return m.attributes}).map(function (r) {
            return {
              column: r.attname, 
              histogram_bounds: self._reformatToJSON(r.histogram_bounds),
              freqs: r.most_common_freqs,
              mostcommon: self._reformatToJSON(r.most_common_vals),
              nulls: r.null_frac
            }
          });
          var stats = rows.reduce(function (p, c) {
            var column = c.column;
            delete c.column;
            p[column] = c; 
            return p;
          }, {})
          self.tables[table] = stats;
          self._processQueue(table);
        }
      }, this);
      this.schemaModel.fetch();

      // var url = 'http://' + this.user + '.localhost.lan:8080/api/v2/sql?q=select * from pg_stats where tablename = \'' + table + '\'&api_key=' + this.apiKey;
      // var r = new XMLHttpRequest();
      // r.open("GET", url, true);
      // r.onreadystatechange = function () {
      //   if (r.readyState !== 4 || r.status !== 200) return;
      //   var rows = JSON.parse(r.responseText).rows.map(function (r) {
      //     return {
      //       column: r.attname, 
      //       histogram_bounds: self._reformatToJSON(r.histogram_bounds),
      //       freqs: r.most_common_freqs,
      //       mostcommon: self._reformatToJSON(r.most_common_vals),
      //       nulls: r.null_frac
      //     }
      //   });
      //   var stats = rows.reduce(function (p, c) {
      //     var column = c.column;
      //     delete c.column;
      //     p[column] = c; 
      //     return p;
      //   }, {})
      //   self.tables[table] = stats;
      //   self._processQueue(table);
      // };
      // r.send();
    }
  },

  _processQueue: function (table) {
    var self = this;
    this.queue[table].forEach(function (callback) {
      callback(self.tables[table]);
    })
  },

  _reformatToJSON: function (sqlData) {
    if (!sqlData) return null
    sqlData = sqlData.replace('{', '').replace('}','').split(',');
    if (!sqlData.some(isNaN)) {
      sqlData = sqlData.map(function (n) {
        return parseInt(n);
      })
    }
    return sqlData
  }
}


function ColumnGraph (stats, options) {
  this.stats = stats;
}

ColumnGraph.prototype = {
  getNullsPercentage: function () {
    return this.stats.nulls
  },

  getPercentageInTopCategories: function (topx) {
    return this.stats.freqs.slice(0, topx || 10).reduce(function (p, c) { return p + c });
  },

  getHistogram: function (options) {
    return this._generateHistogram(options.width, options.height, options.color, options.bins);
  },

  getCategory: function (options) {
    return this._generateCategory(options.width, options.height, options.color);
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
    return canvas
  },

  _generateHistogram: function (width, height, color, bins) {
    if (!this.stats.histogram_bounds) return;
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

    var histogram = this._getHistogramFromBounds(bins);
    histogram.forEach(function (bar, index) {
      var x = index * (barWidth + barSeparation);
      context.beginPath();
      context.fillStyle = color;
      context.fillRect(x, canvas.height, barWidth, - canvas.height * bar);
    })

    // Base line

    context.strokeStyle = '#A1BBA7';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, canvas.height);
    context.lineTo(canvas.width, canvas.height);
    context.stroke();

    return canvas
  },

  _getHistogramFromBounds: function (bins) {
    var bounds = this.stats.histogram_bounds;
    bounds = bounds.sort(function (a, b) { return a - b; });
    var min = bounds[0];
    var max = bounds[bounds.length - 1];
    var witdh = (max - min) / bins;

    function clamp(a, b, t) {
      return Math.max(a, Math.min(b, t));
    }

    function selectivity(bucket_number) {
      var low = min + bucket_number * witdh;
      var high = low + witdh;
      var i = 0;
      var s = 0;
      // calculate overlap
      for (var i = 1; i < bounds.length; ++i) {
        var b_min = bounds[i - 1];
        var b_max = bounds[i];
        var l = clamp(b_min, b_max, low)
        var h = clamp(b_min, b_max, high)
        var span = Math.min(h - l, b_max - b_min);
        s += span / (b_max - b_min)
      }
      return s / 100;
    }
    var buckets = []

    for (var i = 0; i < bins; ++i) {
      buckets.push(selectivity(i));
    }
    return buckets;
  }

}

module.exports = TableStats;
