var Backbone = require('backbone-cdb-v3');
var _ = require('underscore-cdb-v3');
var Pecan = require('cartodb-pecan');
var PecanModel = require('./pecan_model');
var batchAnalysisCount = 5;

/**
 *  Analysis collection
 *
 *  - Get the stats of the current layer
 *
 */

module.exports = Backbone.Collection.extend({

  model: PecanModel,

  initialize: function(mdls, opts) {
    this.user = opts.user;
    this._initBinds();
  },

  _initBinds: function() {
    this.bind('reset', this.pollCheck, this);
  },

  // Public methods

  canStartPecan: function() {
    return this.getTotalAnalysis() === this.getCompletedAnalysis()
  },

  pollCheck: function() {
    if (this._nextAnalysisItems) {
      _.each(this._nextAnalysisItems, function(mdl) {
        mdl.unbind(null, null, this);
      }, this);
    }

    var idleItems = _.first(this.where({ state: 'idle' }),batchAnalysisCount);

    if (idleItems.length > 0) {
      this._nextAnalysisItems = idleItems;

      _.each(this._nextAnalysisItems, function(mdl) {
        if (this.user.featureEnabled('pecan_debugging')) {
          mdl.bind('print_stats', function(stats) {
            this._printStats(stats);
          }, this);
        }
        mdl.bind('change:state', function(mdl, state) {
          if (mdl.isAnalyzed()) {
            var arePendingAnalysis = _.find(this._nextAnalysisItems, function(analysis) {
              return !analysis.isAnalyzed()
            });
            if (!arePendingAnalysis) {
              this.pollCheck();
            }
          }
        }, this);
        mdl.getData();
      }, this);
    }
  },

  _printStats: function(stats) {
    var name        = stats.column;
    var type        = stats.type;
    var weight      = stats.weight;
    var skew        = stats.skew;
    var distinct    = stats.distinct;
    var count       = stats.count;
    var null_ratio  = stats.null_ratio;
    var dist_type   = stats.dist_type;
    var calc_weight = (weight + Pecan.getWeightFromShape(dist_type)) / 2;

    var distinctPercentage = (distinct / count) * 100;

    cdb.log.info("%cAnalyzing %c" + name, "text-decoration:underline; font-weight:bold", "text-decoration:underline; font-weight:normal");

    cdb.log.info('%c · %ctype%c = ' + type, 'color:#666;', 'color: #666; font-weight:bold;', "color: #666; font-weight:normal");
    cdb.log.info('%c · %cdistinctPercentage%c = ' + distinctPercentage, 'color:#666;', 'color: #666; font-weight:bold;', "color: #666; font-weight:normal");
    cdb.log.info('%c · %ccount%c = ' + count, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    cdb.log.info('%c · %cnull ratio%c = ' + null_ratio, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');

    if (dist_type) {
      cdb.log.info('%c · %cdist_type%c = ' + dist_type, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
      cdb.log.info('%c · %ccalc_weight%c = ' + calc_weight, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    }

    if (skew) {
      cdb.log.info("%c · %cskew%c: " + skew.toFixed(2), "color:#666;", 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    }

    if (weight) {
      cdb.log.info("%c · %cweight%c: " + weight.toFixed(2), "color: #666;", "color:#666; font-weight:bold;", "color:#666;font-weight:normal");
    }

    if (stats.density) {
      cdb.log.info("%c · %cdensity%c: " + stats.density, "color:#666;", 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    }

  },

  destroyCheck: function() {
    var items = this.where({ state: 'idle' });
    this.remove(items);
  },

  failedItems: function() {},

  getTotalAnalysis: function() {
    return this.size();
  },

  getSuccessfullyAnalysedColumns: function() {
    return this.where({ success: true }).length;
  },

  getCompletedAnalysis: function() {
    return this.where({ state: 'analyzed' }).length;
  },

  isAnalyzing: function() {
    return this.getCompletedAnalysis() !== this.getTotalAnalysis();
  }

});
