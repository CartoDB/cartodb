var $ = require('jquery');
var WMSLayerView = require('./wms-layer-view');
var CoreView = require('backbone/core-view');
var template = require('./select-layer.tpl');

/**
 * Sub view, to select what layer to use as basemap.
 */
module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');

    this._customBaselayersCollection = opts.customBaselayersCollection;
  },

  render: function () {
    this.clearSubViews();

    var $el = $(
      template({
        searchQuery: this.model.get('searchQuery'),
        layersFound: this.model.getLayers(),
        layersAvailableCount: this.model.layersAvailableCount()
      })
    );
    var $list = $el.find('.js-layers');
    $list.append.apply($list, this._renderedLayers());
    this.$el.html($el);

    return this;
  },

  _renderedLayers: function () {
    return this.model.getLayers().map(function (layer) {
      var view = new WMSLayerView({
        model: layer,
        customBaselayersCollection: this._customBaselayersCollection
      });

      this.addView(view);

      return view.render().el;
    }, this);
  },

  _onClickBack: function (e) {
    this.killEvent(e);

    this.model.set('currentView', 'enterURL');
  }

});
