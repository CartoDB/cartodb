// function Carto() {
//   this._engine = undefined;
// }

// Carto.prototype.init = function (settings) {
//   this._engine = new Engine(settings);
// };

// var carto = new Carto();
var LeafletCartoLayerGroupView = require('../../geo/leaflet/leaflet-cartodb-layer-group-view');
var Engine = require('../../engine');
var NodeNamespaceConstructor = require('./node');
var styleNamespace = require('./style');
var Layer = require('./layer');
var scope;

var carto = {
  init: function (settings) {
    scope = this;
    this._engine = new Engine({
      apiKey: settings.apiKey,
      authToken: settings.authToken,
      username: settings.username,
      serverUrl: settings.serverUrl,
      templateName: settings.templateName,
      statTag: settings.statTag
    });

    this.node = new NodeNamespaceConstructor(this._engine);
    this.style = styleNamespace;
    this.on = function (name, callback) {
      switch (name) {
        case 'error':
          return scope._engine.on(Engine.Events.RELOAD_ERROR, callback);
        case 'reload':
          return scope._engine.on(Engine.Events.RELOAD_SUCCESS, callback);
      }
    };
    this.layers = {
      CartoLayer: function (source, style, opts) {
        return new Layer(source, style, scope._engine, opts);
      },
      add: function (layer) {
        if (Array.isArray(layer)) {
          layer.forEach(layer_ => scope._engine.addLayer(layer_._getInternalLayer()));
        } else {
          scope._engine.addLayer(layer._getInternalLayer());
        }
        scope._reload();
      },
      remove: function (layer) {
        scope._engine.removeLayer(layer._getInternalLayer());
        scope._reload();
      },

      addTo: function (map) {
        function onReload () {
          scope._internalLayerGroup = new LeafletCartoLayerGroupView(scope._engine._cartoLayerGroup, map);
          scope._internalLayerGroup.leafletLayer.addTo(map);
          scope._engine.off(Engine.Events.RELOAD_SUCCESS, onReload);
        }

        if (!scope._addedToMap) {
          scope._addedToMap = true;
          scope._engine.on(Engine.Events.RELOAD_SUCCESS, onReload);
          scope._reload();
        }
      },

      removeFrom: function (map) {
        scope._internalLayerGroup.leafletLayer.removeFrom(map);
        scope._addedToMap = false;
      }
    };

    this._reload = function () {
      if (scope._addedToMap) {
        scope._engine.reload();
      }
    };
  }
};

module.exports = carto;
