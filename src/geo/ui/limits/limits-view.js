var View = require('../tiles/tiles-view.js');
var template = require('../tiles/tiles-template.tpl');
var Sanitize = require('../../../core/sanitize');

/**
 *  Limits overlay
 *
 */

module.exports = View.extend({
  className: 'CDB-Limits',

  render: function () {
    this.$el.html(
      template({
        limits: Sanitize.html('Some tiles might not be rendering correctly. <a target="_blank" href="https://carto.com/docs/faqs/carto-engine-usage-limits">Learn More</a>')
      })
    );

    return this;
  }
});
