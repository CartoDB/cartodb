var View = require('cdb/core/view');
var template = require('./dashboard-map.tpl');

/**
 * Dashboard is a wrapper around the map canvas, which contains widget views for the map contdxt
 * Widgets may be rendered in two areas, in the "sidebar" or "below-map".
 */
module.exports = View.extend({

  initialize: function(options) {
    this._map = options.map;

    // TODO need to render once/here, because there are usages in parent contedxt that grabs the mapView object
    //   to add listeners and whatnot. It smells like there's some model missing somewhere
    this.$el.html(template());
    this.addView(this.mapView);

    return this;
  },

  render: function() {
    // see the todo in initialize
    return this;
  }
});
