var _ = require('underscore');
var templates = require('cdb.templates');
var View = require('../../core/view');

/**
 * View to control the zoom of the map.
 *
 * Usage:
 *
 * var zoomControl = new Zoom({ model: map });
 * mapWrapper.$el.append(zoomControl.render().$el);
 *
 */
module.exports = View.extend({

  className: "CDB-Zoom",

  events: {
    'click .js-ZoomIn': 'zoom_in',
    'click .js-ZoomOut': 'zoom_out'
  },

  default_options: {
    timeout: 0,
    msg: ''
  },

  initialize: function() {
    this.map = this.model;

    _.defaults(this.options, this.default_options);

    this.template = this.options.template ? this.options.template : templates.getTemplate('geo/zoom');
    this.map.bind('change:zoom change:minZoom change:maxZoom', this._checkZoom, this);
  },

  render: function() {
    this.$el.html(this.template(this.options));
    this._checkZoom();
    return this;
  },

  _checkZoom: function() {
    var zoom = this.map.get('zoom');
    this.$('.js-ZoomIn')[ zoom < this.map.get('maxZoom') ? 'removeClass' : 'addClass' ]('is-disabled')
    this.$('.js-ZoomOut')[ zoom > this.map.get('minZoom') ? 'removeClass' : 'addClass' ]('is-disabled')
  },

  zoom_in: function(ev) {
    if (this.map.get("maxZoom") > this.map.getZoom()) {
      this.map.setZoom(this.map.getZoom() + 1);
    }
    ev.preventDefault();
    ev.stopPropagation();
  },

  zoom_out: function(ev) {
    if (this.map.get("minZoom") < this.map.getZoom()) {
      this.map.setZoom(this.map.getZoom() - 1);
    }
    ev.preventDefault();
    ev.stopPropagation();
  }

});
