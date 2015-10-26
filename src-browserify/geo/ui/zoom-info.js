var View = require('../../core/view');

/**
 * View to know which is the map zoom.
 *
 * Usage:
 *
 * var zoomInfo = new ZoomInfo({ model: map });
 * mapWrapper.$el.append(zoomInfo.render().$el);
 *
 */
module.exports = View.extend({

  className: "cartodb-zoom-info",

  initialize: function() {
    this.model.bind("change:zoom", this.render, this);
  },

  render: function() {
    this.$el.html(this.model.get("zoom"));
    return this;
  }
});
