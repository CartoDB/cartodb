var CoreView = require('backbone/core-view');
var template = require('./mosaic-item.tpl');
var AddBasemapView = require('../modals/add-basemap/add-basemap-view');

module.exports = CoreView.extend({

  className: 'Mosaic-item js-add is-hidden',

  tagName: 'li',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave',
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._modals = opts.modals;
    this._userLayersCollection = opts.userLayersCollection;
  },

  render: function () {
    this.$el.html(
      template({
        name: this.model.getName(),
        template: this.model.get('template')()
      })
    );
    return this;
  },

  _onMouseEnter: function () {
    this.model.set('highlighted', true);
  },

  _onMouseLeave: function () {
    this.model.set('highlighted', false);
  },

  _onClick: function () {
    var self = this;

    var modal = this._modals.create(function (modalModel) {
      return new AddBasemapView({
        layerDefinitionsCollection: self._layerDefinitionsCollection,
        userLayersCollection: self._userLayersCollection
      });
    });
    modal.show();
  }

});
