var Backbone = require('backbone');

/**
 * Collection of Dataviews
 */
module.exports = Backbone.Collection.extend({
  initialize: function () {
    // If a histogram model applies the histogram sizes, rest should remove/disable
    // the sizes applied before.
    this.bind('change:histogramSizes', function (m, isSizesApplied) {
      if (isSizesApplied) {
        this.each(function (mdl) {
          if (mdl !== m && mdl.get('histogramSizes')) {
            mdl.set('histogramSizes', false);
          }
        });
      }
    }, this);
  }
});
