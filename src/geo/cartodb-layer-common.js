var _ = require('underscore');

/**
 *  common functions for cartodb connector
 */
function CartoDBLayerCommon() {
  this.visible = true;
  this.interactionEnabled = [];
}

CartoDBLayerCommon.prototype = {

  // the way to show/hidelayer is to set opacity
  // removing the interactivty at the same time
  show: function() {
    this.setOpacity(this.options.previous_opacity === undefined ? 0.99: this.options.previous_opacity);
    delete this.options.previous_opacity;
    this._interactionDisabled = false;
    this.visible = true;
  },

  hide: function() {
    if(this.options.previous_opacity == undefined) {
      this.options.previous_opacity = this.options.opacity;
    }
    this.setOpacity(0);
    // disable here interaction for all the layers
    this._interactionDisabled = true;
    this.visible = false;
  },

  toggle: function() {
    this.isVisible() ? this.hide() : this.show();
    return this.isVisible();
  },

  /**
   * Returns if the layer is visible or not
   */
  isVisible: function() {
    return this.visible;
  },

  /**
   * Active or desactive interaction
   * @params enable {Number} layer number
   * @params layer {Boolean} Choose if wants interaction or not
   */
  setInteraction: function(layer, b) {
    // shift arguments to maintain compatibility
    if (b == undefined) {
      b = layer;
      layer = 0;
    }
    var layerInteraction;
    this.interactionEnabled[layer] = b;
    if (!b) {
      layerInteraction = this.interaction[layer];
      if(layerInteraction) {
        layerInteraction.remove();
        this.interaction[layer] = null;
      }
    } else {
      // if urls is null it means that setInteraction will be called
      // when the layergroup token was recieved, then the real interaction
      // layer will be created
      if (this.model.get('urls')) {
        // generate the tilejson from the urls. wax needs it
        // var layer_index = this.getLayerIndexByNumber(+layer);
        var layer_index = +layer;
        var tilejson = this.model.getTileJSONFromTiles(layer_index);

        // remove previous
        layerInteraction = this.interaction[layer];
        if(layerInteraction) {
          layerInteraction.remove();
        }
        var self = this;

        // add the new one
        this.interaction[layer] = this.interactionClass()
          .map(this.options.map)
          .tilejson(tilejson)
          .on('on', function(o) {
            if (self._interactionDisabled) return;
            o.layer = +layer;
            self._manageOnEvents(self.options.map, o);
          })
          .on('off', function(o) {
            if (self._interactionDisabled) return;
            o = o || {}
            o.layer = +layer;
            self._manageOffEvents(self.options.map, o);
          });
      }
    }
    return this;
  },

  error: function(e) {
    //console.log(e.error);
  },

  tilesOk: function() {
  },

  _reloadInteraction: function() {

    // Clear existing interaction
    this._clearInteraction();

    // Enable interaction for the layers that have interaction
    // (are visible AND have tooltips OR infowindows)
    this.model.layers.each(function(layer, index) {
      if (layer.hasInteraction()) {
        this.setInteraction(index, true);
      }
    }.bind(this))
  },

  _clearInteraction: function() {
    for(var i in this.interactionEnabled) {
      if (this.interactionEnabled.hasOwnProperty(i) &&
        this.interactionEnabled[i]) {
        this.setInteraction(i, false);
      }
    }
  }
};

module.exports = CartoDBLayerCommon;
