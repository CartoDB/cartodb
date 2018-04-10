const Backbone = require('backbone');
const _ = require('underscore');
const Pecan = require('cartodb-pecan');
const PecanModel = require('./pecan-model');
const batchAnalysisCount = 5;

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];

/**
 *  Analysis collection
 *
 *  - Get the stats of the current layer
 *
 */

module.exports = Backbone.Collection.extend({
  model: PecanModel,

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('reset', this.pollCheck, this);
  },

  // Public methods

  canStartPecan: function () {
    return this.getTotalAnalysis() === this.getCompletedAnalysis();
  },

  pollCheck: function () {
    if (this._nextAnalysisItems) {
      _.each(this._nextAnalysisItems, function (mdl) {
        mdl.unbind(null, null, this);
      }, this);
    }

    const idleItems = _.first(this.where({ state: 'idle' }), batchAnalysisCount);

    if (idleItems.length > 0) {
      this._nextAnalysisItems = idleItems;

      _.each(this._nextAnalysisItems, function (mdl) {
        if (this._userModel.featureEnabled('pecan_debugging')) {
          mdl.bind('print_stats', function (stats) {
            this._printStats(stats);
          }, this);
        }
        mdl.bind('change:state', function (mdl, state) {
          if (mdl.isAnalyzed()) {
            const arePendingAnalysis = _.find(this._nextAnalysisItems, function (analysis) {
              return !analysis.isAnalyzed();
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

  _printStats: function (stats) {
    const name = stats.column;
    const type = stats.type;
    const weight = stats.weight;
    const skew = stats.skew;
    const distinct = stats.distinct;
    const count = stats.count;
    const null_ratio = stats.null_ratio;
    const dist_type = stats.dist_type;
    const calc_weight = (weight + Pecan.getWeightFromShape(dist_type)) / 2;

    const distinctPercentage = (distinct / count) * 100;

    // TODO: Still pending
    // cdb.log.info("%cAnalyzing %c" + name, "text-decoration:underline; font-weight:bold", "text-decoration:underline; font-weight:normal");

    // cdb.log.info('%c · %ctype%c = ' + type, 'color:#666;', 'color: #666; font-weight:bold;', "color: #666; font-weight:normal");
    // cdb.log.info('%c · %cdistinctPercentage%c = ' + distinctPercentage, 'color:#666;', 'color: #666; font-weight:bold;', "color: #666; font-weight:normal");
    // cdb.log.info('%c · %ccount%c = ' + count, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    // cdb.log.info('%c · %cnull ratio%c = ' + null_ratio, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');

    // if (dist_type) {
    //   cdb.log.info('%c · %cdist_type%c = ' + dist_type, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    //   cdb.log.info('%c · %ccalc_weight%c = ' + calc_weight, 'color:#666;', 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    // }

    // if (skew) {
    //   cdb.log.info("%c · %cskew%c: " + skew.toFixed(2), "color:#666;", 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    // }

    // if (weight) {
    //   cdb.log.info("%c · %cweight%c: " + weight.toFixed(2), "color: #666;", "color:#666; font-weight:bold;", "color:#666;font-weight:normal");
    // }

    // if (stats.density) {
    //   cdb.log.info("%c · %cdensity%c: " + stats.density, "color:#666;", 'color: #666; font-weight:bold;', 'color: #666; font-weight:normal;');
    // }
  },

  destroyCheck: function () {
    const items = this.where({ state: 'idle' });
    this.remove(items);
  },

  failedItems: function () {},

  getTotalAnalysis: function () {
    return this.size();
  },

  getSuccessfullyAnalysedColumns: function () {
    return this.where({ success: true }).length;
  },

  getCompletedAnalysis: function () {
    return this.where({ state: 'analyzed' }).length;
  },

  isAnalyzing: function () {
    return this.getCompletedAnalysis() !== this.getTotalAnalysis();
  }

});
