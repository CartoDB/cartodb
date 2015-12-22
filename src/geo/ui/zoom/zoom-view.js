var View = require('../../../core/view');
var template = require('./zoom-template.tpl');

/**
 * View to control the zoom of the map.
 *
 * Usage:
 *
 * var zoomControl = new Zoom({ model: map, template: "" });
 * mapWrapper.$el.append(zoomControl.render().$el);
 *
 */

module.exports = View.extend({
  className: 'CDB-Zoom',

  events: {
    'click .js-zoomIn': '_onZoomIn',
    'click .js-zoomOut': '_onZoomOut',
    'dblclick': 'killEvent'
  },

  options: {
    timeout: 0,
    msg: ''
  },

  initialize: function () {
    this.map = this.model;
    this.template = this.options.template || template;
    this.map.bind('change:zoom change:minZoom change:maxZoom', this._checkZoom, this);
  },

  render: function () {
    this.$el.html(this.template(this.options));
    this._checkZoom();
    return this;
  },

  _checkZoom: function () {
    var zoom = this.map.get('zoom');
    this.$('.js-zoomIn')[ zoom < this.map.get('maxZoom') ? 'removeClass' : 'addClass' ]('is-disabled');
    this.$('.js-zoomOut')[ zoom > this.map.get('minZoom') ? 'removeClass' : 'addClass' ]('is-disabled');
    this.$('.js-zoomInfo').text(zoom);
  },

  _onZoomIn: function (ev) {
    this.killEvent(ev);

    if (this.map.get('maxZoom') > this.map.getZoom()) {
      this.map.setZoom(this.map.getZoom() + 1);
    }
  },

  _onZoomOut: function (ev) {
    this.killEvent(ev);

    if (this.map.get('minZoom') < this.map.getZoom()) {
      this.map.setZoom(this.map.getZoom() - 1);
    }
  }

});
