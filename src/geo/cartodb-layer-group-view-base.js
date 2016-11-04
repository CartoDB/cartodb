function CartoDBLayerGroupViewBase (layerGroupModel) {
  layerGroupModel.on('change:urls', this._reload, this);
  layerGroupModel.onLayerVisibilityChanged(this._reload.bind(this));
}

CartoDBLayerGroupViewBase.prototype = {
  _reload: function () {
    throw new Error('_reload must be implemented');
  },

  _reloadInteraction: function () {
    this._clearInteraction();

    this.model.each(function (layer, layerIndex) {
      if (layer.isVisible()) {
        this._enableInteraction(layerIndex);
      }
    }, this);
  },

  _clearInteraction: function () {
    for (var layerIndex in this.interaction) {
      if (this.interaction.hasOwnProperty(layerIndex) &&
        this.interaction[layerIndex]) {
        this.interaction[layerIndex].remove();
        this.interaction[layerIndex] = null;
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

  error: function (e) {},

  tilesOk: function () {}
};

module.exports = CartoDBLayerGroupViewBase;
