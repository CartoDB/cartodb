var _ = require('underscore');
var cdb = require('cartodb.js');
var Pecan = require('cartodb-pecan');

/**
 *  Pecan model
 *
 */

module.exports = cdb.core.Model.extend({

  _REJECT: 0,
  _KEEP: 1,
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

    if (this._analyzeStats(stats) === this._KEEP) {
      var response = Pecan.guessMap(this.query, this.get("table_id"), this, stats);

      if (response) {
        properties = _.extend(properties, { success: true }, stats, response);
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
  },

  _analyzeStats: function(stats) {
    var type = stats.type;

    if (this._PRINT_STATS) {
      this.trigger("print_stats", stats, this);
    }

    var result = this._REJECT;

    if (type === 'string') {
      result = this._analyzeString(stats);
    } else if (type === 'number') {
      result = this._analyzeNumber(stats);
    } else if (type === 'boolean') {
      result = this._analyzeBoolean(stats);
    } else if (type === 'date') {
      result = this._analyzeDate(stats);
    } else if (type === 'geom') {
      result = this._analyzeGeom(stats);
    }

    return result;
  },

  _analyzeGeom: function(stats) {
    if (this.get("geometry_type") !== 'point') {
      return this._REJECT;
    }

    if (stats.cluster_rate * stats.density < 0.1) {
      return this._REJECT;
    }
    return this._KEEP;
  },


  _analyzeString: function(stats) {
    if (stats.weight >= 0.8) {
      return this._KEEP;
    } else if (stats.weight < 0.1 || !stats.weight) {
      return this._REJECT;
    }

    if (stats.null_ratio > 0.95) {
      return this._REJECT;
    }

    return this._REJECT;
  },

  _analyzeNumber: function(stats) {
    var distinctPercentage = (stats.distinct / stats.count) * 100;
    var dist_type   = stats.dist_type;
    var calc_weight = (stats.weight + Pecan.getWeightFromShape(dist_type)) / 2;

    if (stats.weight < 0.1 || !stats.weight) {
      return this._REJECT;
    }

    if (calc_weight >= 0.5) {
      return this._KEEP;
    } else if (stats.weight > 0.5 || distinctPercentage < 25) {
      if (distinctPercentage < 1) {
        return this._KEEP;
      }
      return this._KEEP;
    }

    return this._REJECT;
  },

  _analyzeBoolean: function(stats) {
    if (stats.null_ratio > 0.75) {
      return this._REJECT;
    }
    return this._KEEP;
  },

  _analyzeDate: function(stats) {
    if (this.get("geometry_type") !== 'point') {
      return this._REJECT;
    }

    if (stats.null_ratio > 0.75) {
      return this._REJECT;
    }
    return this._KEEP;
  }

});
