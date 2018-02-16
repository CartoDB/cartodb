var CoreView = require('backbone/core-view');
var Router = require('builder/routes/router');

/**
 * Base view for all base layer views.
 */
module.exports = CoreView.extend({
  module: 'editor:layers:layer-views:base-layer-view-base',

  tagName: 'li',

  className: 'BlockList-item BlockList-item--basemap js-layer ui-state-disabled',

  events: {
    'click': '_onEditBasemap'
  },

  initialize: function (opts) {
    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    this.$el.html(this._getCompiledTemplate());

    return this;
  },

  _getCompiledTemplate: function () {
    throw new Error('subclasses of BasemapLayerViewBase must implement _getCompiledTemplate');
  },

  _onEditBasemap: function (e) {
    e.stopPropagation();

    Router.goToBaseMap();
  }
});
