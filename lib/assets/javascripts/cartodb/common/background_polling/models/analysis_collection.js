var Backbone = require('backbone');
var _ = require('underscore');
var PecanModel = require('./pecan_model');

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
    if (this._nextAnalysis) {
      this._nextAnalysis.unbind(null, null, this);
    }

    var availableItems = this.where({ state: 'idle' });
    
    if (availableItems.length > 0) {
      this._nextAnalysis = availableItems[0];
      this._nextAnalysis.bind('change:state', function(mdl, state) {
        if (mdl.isAnalyzed()) {
          this.pollCheck();
        }
      }, this);
      this._nextAnalysis.getData();
    }
  },

  destroyCheck: function() {
    var items = this.where({ state: 'idle' });
    this.remove(items);
  },

  failedItems: function() {
    
  },

  getTotalAnalysis: function() {
    return this.size();
  },

  getCompletedAnalysis: function() {
    return this.where({ state: 'analyzed' }).length
  },

  isAnalyzing: function() {
    return this.getCompletedAnalysis() !== this.getTotalAnalysis();
  }

});