/**
 * zoom view to control the zoom of the map
 * usage:
 *
 * var zoomControl = new cdb.geo.ui.Zoom({model: map});
 * view.append(zoomControl.render().el);
 *
 */

cdb.geo.ui.Zoom = cdb.core.View.extend({

  //tagName: 'div',

  events: {
    'click .zoom_in': 'zoom_in',
    'click .zoom_out': 'zoom_out'
  },

  default_options: {
      timeout: 0,
      msg: ''
  },

  initialize: function() {
      this.map = this.model;
      _.defaults(this.options, this.default_options);
      this.template = this.options.template ? _.template(this.options.template): cdb.templates.getTemplate('geo/zoom');
      //TODO: bind zoom change to disable zoom+/zoom-
  },

  render: function() {
    var $el = this.$el;
    $el.html(this.template(this.options));
    return this;
  },

  zoom_in: function() {
      this.map.setZoom(this.map.getZoom() + 1);
  },

  zoom_out: function() {
      this.map.setZoom(this.map.getZoom() - 1);
  }

});
