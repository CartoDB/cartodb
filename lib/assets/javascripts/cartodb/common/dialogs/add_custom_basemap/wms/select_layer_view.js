var cdb = require('cartodb.js');
var $ = require('jquery');
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
    var $el = $(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/wms/select_layer')({
        q: this.options.q,
        layersFound: this.model.get('layers'),
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
    return this.model.get('layers').map(function(layer) {
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
