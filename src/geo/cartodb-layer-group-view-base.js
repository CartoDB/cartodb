var parseWindshaftErrors = require('../windshaft/error-parser');

function CartoDBLayerGroupViewBase (layerGroupModel, opts) {
  opts = opts || {};
  this.interaction = [];
  this.nativeMap = opts.nativeMap;
  this._mapModel = opts.mapModel;

  layerGroupModel.on('change:urls', this._reload, this);
  layerGroupModel.onLayerVisibilityChanged(this._reload.bind(this));

  this._reload();
}

CartoDBLayerGroupViewBase.prototype = {
  _reload: function () {
    throw new Error('_reload must be implemented');
  },

  _reloadInteraction: function () {
    this._clearInteraction();

    this.model.forEachGroupedLayer(function (layerModel, layerIndex) {
      if (this._isIteractionEnabledForLayer(layerModel)) {
        this._enableInteraction(layerIndex);
      }
    }, this);
  },

  _isIteractionEnabledForLayer: function (layerModel) {
    if (!layerModel.isVisible()) {
      return false;
    }
    // Builder needs interactivity when the layer has no popup/infowindows to allow feature edition.
    return layerModel.isInteractive() || this._mapModel.isFeatureInteractivityEnabled();
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

      // eslint-disable-next-line
      this.interaction[layerIndexInLayerGroup] = new this.interactionClass()
        .map(this.nativeMap)
        .tilejson(tilejson)
        .on('on', function (o) {
          if (self._interactionDisabled) return;
          o.layer = layerIndexInLayerGroup;
          self._manageOnEvents(self.nativeMap, o);
        })
        .on('off', function (o) {
          if (self._interactionDisabled) return;
          o = o || {};
          // TODO: zera has an .on('error', () => { }) callback that should be used here
          if (o.errors != null) {
            self._manageInteractivityErrors(o);
          }
          o.layer = layerIndexInLayerGroup;
          self._manageOffEvents(self.nativeMap, o);
        });
    }
  },

  _manageInteractivityErrors: function (payload) {
    var errors = parseWindshaftErrors(payload);
    if (errors.length > 0) {
      this.trigger('featureError', errors[0]);
    }
  },

  _generateTileJSON: function (layerIndexInLayerGroup) {
    if (this.model.hasURLs()) {
      return {
        tilejson: '2.0.0',
        scheme: 'xyz',
        grids: this.model.getGridURLTemplatesWithSubdomains(layerIndexInLayerGroup),
        tiles: this.model.getTileURLTemplatesWithSubdomains(),
        formatter: function (options, data) { return data; }
      };
    }
  },

  error: function (e) { },

  tilesOk: function () { }
};

module.exports = CartoDBLayerGroupViewBase;
