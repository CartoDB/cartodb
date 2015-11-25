var Backbone = require('backbone');
var _ = require('underscore');

/**
 *  Collection that controls widget models per layer
 *
 */

module.exports = Backbone.Collection.extend({

  initialize: function() {
    this._initBinds();
  },

  _initBinds: function() {
    // If a category model applies the category colors, rest should remove/disable
    // the category colors applied before.
    this.bind('change:categoryColors', function(m, isColorCategorized) {
      if (isColorCategorized) {
        this.each(function(mdl) {
          if (mdl !== m && mdl.get('categoryColors')) {
            mdl.set('categoryColors', false);
          }
        })
      }
    }, this);

    // If a histogram model applies the histogram sizes, rest should remove/disable
    // the sizes applied before.
    this.bind('change:histogramSizes', function(m, isSizesApplied) {
      if (isSizesApplied) {
        this.each(function(mdl) {
          if (mdl !== m && mdl.get('histogramSizes')) {
            mdl.set('histogramSizes', false);
          }
        })
      }
    }, this);
  }

});
