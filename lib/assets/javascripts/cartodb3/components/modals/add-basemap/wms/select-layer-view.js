var $ = require('jquery');
var LayerView = require('./layer-view.js');
var CoreView = require('backbone/core-view');
var template = require('./select-layer.tpl');

/**
 * Sub view, to select what layer to use as basemap.
 */
module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  render: function () {
    this.clearSubViews();

    var $el = $(
      template({
        searchQuery: this.model.get('searchQuery'),
        layersFound: this.model.getLayers(),
        layersAvailableCount: this.model.layersAvailableCount()
        // pluralizeStr: pluralizeStr
        // pluralize: _t('components.modals.add-layer.imports.item-pluralize', { smart_count: size })
      })
    );
    var $list = $el.find('.js-layers');
    $list.append.apply($list, this._renderedLayers());
    this.$el.html($el);
    return this;
  },

  _renderedLayers: function () {
    return this.model.getLayers().map(function (layer) {
      var view = new LayerView({
        model: layer,
        baseLayers: this.model.get('baseLayers')
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
