var _ = require('underscore');

function CartoDBLayerGroupViewBase (layerGroupModel) {
  this.visible = true;
  this.interactionEnabled = [];

  layerGroupModel.on('change:urls', this._reload, this);
  layerGroupModel.onLayerVisibilityChanged(this._reload.bind(this));
}

CartoDBLayerGroupViewBase.prototype = {
  _reload: function () {
    throw new Error('_reload must be implemented');
  },

  _reloadInteraction: function () {
    this._clearInteraction();

    // Enable interaction for the layers that have interaction
    // (are visible AND have tooltips OR infowindows)
    this.model.each(function (layer, layerIndex) {
      if (layer.hasInteraction()) {
        this._enableInteraction(layerIndex);
      }
    }, this);
  },

  _clearInteraction: function () {
    for (var layerIndex in this.interactionEnabled) {
      if (this.interactionEnabled.hasOwnProperty(layerIndex) &&
        this.interactionEnabled[layerIndex]) {
        this._disableInteraction(layerIndex);
      }
    }
  },

  _enableInteraction: function (layerIndexInLayerGroup) {
    var self = this;
    var tilejson = this._generateTileJSON(layerIndexInLayerGroup);
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

  _generateTileJSON: function (layerIndexInLayerGroup) {
    if (this.model.hasURLs()) {
      return {
        tilejson: '2.0.0',
        scheme: 'xyz',
        grids: this.model.getGridURLTemplates(layerIndexInLayerGroup),
        tiles: this.model.getTileURLTemplates(),
        formatter: function (options, data) { return data; }
      };
    }
  },

  _disableInteraction: function (layerIndexInLayerGroup) {
    var layerInteraction = this.interaction[layerIndexInLayerGroup];
    if (layerInteraction) {
      layerInteraction.remove();
      this.interaction[layerIndexInLayerGroup] = null;
    }
  },

  error: function (e) {},

  tilesOk: function () {}
};

module.exports = CartoDBLayerGroupViewBase;
