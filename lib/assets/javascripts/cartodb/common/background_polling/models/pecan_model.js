var Backbone = require('backbone');
var _ = require('underscore');

/**
 *  Pecan model
 *
 */

module.exports = cdb.core.Model.extend({

  _REJECT: 0,
  _KEEP: 1,
  _GET_BBOX_FROM_THE_GEOM: true,

  defaults: {
    table_id: '',
    column: '',
    state: 'idle'
  },

  initialize: function() {
    this.sql = cdb.admin.SQL();
  },

  getData: function() {
    var self = this;

    var query = 'SELECT * FROM ' + this.get("table_id");

    this.sql.describe(query, this.get("column"), {}, function(stats) {
      var properties = {};
      var response = self._analyzeStats(stats);

      if (response === self._KEEP) {
        properties.success = true;
      } else if (response === self._REJECT) {
        properties.success = false;
      }

      self.set(_.extend(properties, stats, { state: 'analyzed' }));
    });

  },

  isAnalyzed: function() {
    return this.get('state') === 'analyzed';
  },

  hasFailed: function() {
    return this.get('state') ===  'failed';
  },

  _analyzeStats: function(stats) {
    var name = this.get("column");
    var type = this.get("new_type") ? this.get("new_type") : stats.type;

    this._printStats(stats);

    var result = this._REJECT;

    if (type === 'string') {
      result = this._analyzeString(stats);
    } else if (type === 'number') {
      result = this._analyzeNumber(stats);
    } else if (type === 'boolean') {
      result = this._analyzeBoolean(stats);
    } else if (type === 'date') {
      result = this._analyzeDate(stats);
    }

    if (result === this._KEEP) {
      this._approveMessage(name);
    }

    return result;
  },

  _analyzeString: function(stats) {
    var name = this.get("column");
    if (stats.weight >= 0.8) {
      return this._KEEP;
    } else if (stats.weight < 0.1 || !stats.weight) {
      this._rejectMessage(name, "weight is 0", stats.weight);
      return this._REJECT;
    }

    if (stats.null_ratio > 0.95) {
      this._rejectMessage(name, "null_ratio > 95%", stats.null_ratio  * 100);
      return this._REJECT;
    }
    return this._KEEP;
  },

  _analyzeNumber: function(stats) {
    var name = this.get("column");
    var distinctPercentage = (stats.distinct / stats.count) * 100;
    var dist_type   = stats.dist_type;
    var calc_weight = cdb.CartoCSS.getWeightFromShape(dist_type);

    if (stats.weight < 0.1 || !stats.weight) {
      this._rejectMessage(name, "weight is 0", stats.weight);
      return this._REJECT;
    }

    if (calc_weight === 0.9) {
      return this._KEEP;
    } else if (stats.weight > 0.5 || distinctPercentage < 25) {
      if (distinctPercentage < 1) {
        this._redoMessage(name);
        return this._KEEP;
      }
      return this._KEEP;
    }

    this._rejectMessage(name, "distinctPercentage is > 25 && weight < 0.5");
    return this._REJECT;
  },

  _analyzeBoolean: function(stats) {
    var name = this.get("column");
    if (stats.null_ratio > 0.75) {
      this._rejectMessage(name, "null_ratio > 75%", stats.null_ratio  * 100);
      return this._REJECT;
    }
    return this._KEEP;
  },

  _analyzeDate: function(stats) {
    var name = this.get("column");
    if (stats.null_ratio > 0.75) {
      this._rejectMessage(name, "null_ratio > 75%", stats.null_ratio  * 100);
      return this._REJECT;
    }
    return this._KEEP;
  },

  _printStats: function(stats) {
    var name        = this.get("column");
    var type        = this.get("new_type") ? this.get("new_type") : stats.type;
    var weight      = stats.weight;
    var skew        = stats.skew;
    var distinct    = stats.distinct;
    var count       = stats.count;
    var null_ratio  = stats.null_ratio;
    var dist_type   = stats.dist_type;
    var calc_weight = cdb.CartoCSS.getWeightFromShape(dist_type);

    var distinctPercentage = (distinct / count) * 100;

    console.log("%cAnalyzing %c" + name, "text-decoration:underline; font-weight:bold", "text-decoration:underline; font-weight:normal");

    console.log('%c · %ctype%c = ' + type, 'color:#666;', 'color: #666; font-weight:bold;', "color: #666; font-weight:normal");
    console.log('%c · %cdistinctPercentage%c = ' + distinctPercentage, 'color:#666;', 'color: #666; font-weight:bold;', "color: #666; font-weight:normal");
    console.log('%c · %ccount%c = ' + count, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    console.log('%c · %cnull ratio%c = ' + null_ratio, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');

    if (dist_type) {
      console.log('%c · %cdist_type%c = ' + dist_type, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
      console.log('%c · %ccalc_weight%c = ' + calc_weight, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    }

    if (skew) {
      console.log("%c · %cskew%c: " + skew.toFixed(2), "color:#666;", 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    }

    if (weight) {
      console.log("%c · %cweight%c: " + weight.toFixed(2), "color: #666;", "color:#666; font-weight:bold;", "color:#666;font-weight:normal");
    }

  },

  _redoMessage: function(name, message, value) {
    console.log('%c > turned into category', "color:pink;");
  },

  _rejectMessage: function(name, message, value) {
    console.log('%c = rejected because ' + message + ": %c" + (value ? value : ""), "color:red;", "color:red; font-weight:bold");
  },

  _approveMessage: function(name) {
    console.log('%c = approved', "color:green;");
  },

});
