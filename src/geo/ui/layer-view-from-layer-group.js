var LayerView = require('./layer-view');

/**
 *  View for each layer from a layer group
 *  - It needs a model and the layer_definition to make it work.
 *
 *  var layerView = new cdb.geo.ui.LayerViewFromLayerGroup({
 *    model: layer_model,
 *    layerView: layweView
 *  });
 *
 */
var LayerViewFromLayerGroup = LayerView.extend({

  _onSwitchSelected: function() {

    LayerView.prototype._onSwitchSelected.call(this);
    var sublayer = this.options.layerView.getSubLayer(this.options.layerIndex)
    var visible = this.model.get('visible');

    if (visible) {
      sublayer.show();
    } else {
      sublayer.hide();
    }
  }
});

module.exports = LayerViewFromLayerGroup;
