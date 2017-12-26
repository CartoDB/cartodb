var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var pluralizeStr = require('../../../view_helpers/pluralize_string');
var LayerView = require('./layer_view.js');

/**
 * Sub view, to select what layer to use as basemap.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  render: function() {

    this.clearSubViews();

    var $el = $(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/wms/select_layer')({
        searchQuery: this.model.get('searchQuery'),
        layersFound: this.model.getLayers(),
        layersAvailableCount: this.model.layersAvailableCount(),
        pluralizeStr: pluralizeStr
      })
    );
    var $list = $el.find('.js-layers');
    $list.append.apply($list, this._renderedLayers());
    this.$el.html($el);
    return this;
  },

  _renderedLayers: function() {
    return this.model.getLayers().map(function(layer) {
      var view = new LayerView({
        model: layer,
        baseLayers: this.model.get('baseLayers')
      });
      this.addView(view);
      return view.render().el;
    }, this);
  },

  _onClickBack: function(ev) {
    this.killEvent(ev);
    this.model.set('currentView', 'enterURL');
  }

});
