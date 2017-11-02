function FeatureEvent (layer, latlng, data) {
  this._layer = layer;
  this._latlng = latlng;
  this._data = data;
}

FeatureEvent.prototype.getLatLng = function () {
  if (this._latlng) {
    return {
      lat: this._latlng[0],
      lng: this._latlng[1]
    };
  }
};

FeatureEvent.prototype.getData = function () {
  return this._data;
};

FeatureEvent.createFromInternalFeatureEvent = function (internalEvent, layer) {
  return new FeatureEvent(layer, internalEvent.latlng, internalEvent.feature);
};

module.exports = FeatureEvent;
