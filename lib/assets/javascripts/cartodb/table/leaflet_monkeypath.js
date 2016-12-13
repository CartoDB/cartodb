
/**
 * this is a monkey patch for leaflet removeLayer
 * this method version is the same than leaflet 0.7.3 but adds a check to finish the zoom animation when there are no layers (see comments)
 *
 */

if (L.version !== '0.7.3') {
  throw new Error("remove leaflet_monkeypatch.js file");
}

L.Map.prototype.removeLayer = function (layer) {
  var id = L.stamp(layer);

  if (!this._layers[id]) { return this; }

  if (this._loaded) {
      layer.onRemove(this);
  }

  delete this._layers[id];

  if (this._loaded) {
      this.fire('layerremove', {layer: layer});
  }

  if (this._zoomBoundLayers[id]) {
      delete this._zoomBoundLayers[id];
      this._updateZoomLevels();
  }

  // TODO looks ugly, refactor
  if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {
      /** patch code **/
      if (this._tryAnimatedZoom && this._animatingZoom) {
        if (this._nothingToAnimate()) {
          this._onZoomTransitionEnd();
        }
      }
      /** ~patch code **/
      this._tileLayersNum--;
      this._tileLayersToLoad--;
      layer.off('load', this._onTileLayerLoad, this);
  }

  return this;
};
