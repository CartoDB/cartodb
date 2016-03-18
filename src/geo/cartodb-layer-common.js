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
  setInteraction: function(layerIndexInLayerGroup, enableInteraction) {
    // shift arguments to maintain compatibility
    if (enableInteraction === undefined) {
      enableInteraction = layerIndexInLayerGroup;
      layerIndexInLayerGroup = 0;
    }

    this.interactionEnabled[layerIndexInLayerGroup] = enableInteraction;
    if (enableInteraction) {
      this._enableInteraction(layerIndexInLayerGroup);
    } else {
      this._disableInteraction(layerIndexInLayerGroup);
    }

    return this;
  },

  _enableInteraction: function (layerIndexInLayerGroup) {
    var self = this;
    var tilejson = this.model.getTileJSONFromTiles(layerIndexInLayerGroup);
    if (tilejson) {
      var previousLayerInteraction = this.interaction[layerIndexInLayerGroup];
      if (previousLayerInteraction) {
        previousLayerInteraction.remove();
      }

      this.interaction[layerIndexInLayerGroup] = this.interactionClass()
        .map(this.options.map)
        .tilejson(tilejson)
        .on('on', function (o) {
          if (self._interactionDisabled) return;
          o.layer = layerIndexInLayerGroup;
          self._manageOnEvents(self.options.map, o);
        })
        .on('off', function (o) {
          if (self._interactionDisabled) return;
          o = o || {};
          o.layer = layerIndexInLayerGroup;
          self._manageOffEvents(self.options.map, o);
        });
    }
  },

  _disableInteraction: function (layerIndexInLayerGroup) {
    var layerInteraction = this.interaction[layerIndexInLayerGroup];
    if (layerInteraction) {
      layerInteraction.remove();
      this.interaction[layerIndexInLayerGroup] = null;
    }
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
