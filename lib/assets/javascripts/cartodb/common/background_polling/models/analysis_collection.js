var Backbone = require('backbone');
var _ = require('underscore');
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
