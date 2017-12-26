var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var Pecan = require('cartodb-pecan');

/**
 *  Pecan model
 *
 */

module.exports = cdb.core.Model.extend({

  _PRINT_STATS: true,

  defaults: {
    table_id: '',
    column: '',
    state: 'idle'
  },

  initialize: function() {
    _.bindAll(this, "_onDescribe");
    this.sql = cdb.admin.SQL();
    this.query = 'SELECT * FROM ' + this.get("table_id");
  },

  getData: function() {
    this.sql.describe(this.query, this.get("column"), {}, this._onDescribe);
  },

  _onDescribe: function(stats) {
    var properties = {
      state: "analyzed",
      success: false
    };

    if (this._PRINT_STATS) {
      this.trigger('print_stats', stats, this);
    }

    var hasEnoughToGuess = Pecan.hasEnoughToGuess({
      stats: stats,
      isPointGeometryType: this.get('geometry_type') === 'point'
    });

    if (hasEnoughToGuess) {
      var response = Pecan.guessMap({
        tableName: this.get('table_id'),
        column: {
          stats: stats,
          geometryType: this.get('geometry_type'),
          bbox: this.get('bbox')
        },
        dependencies: {
          underscore: _
        }
      });

      if (response) {
        var overrides = {
          sql: this.query,
          success: true
        };
        properties = _.extend(properties, overrides, stats, response);
      }
    }

    if (stats.type === 'geom' && stats.bbox) {
      properties.bbox = stats.bbox;
    }

    this.set(properties);
  },

  isAnalyzed: function() {
    return this.get('state') === 'analyzed';
  },

  hasFailed: function() {
    return this.get('state') === 'failed';
  }

});
