var _ = require('underscore');

function Layers (layers) {
  this._layers = layers || [];
}

Layers.prototype.add = function (layer) {
  this._layers.push(layer);
  return layer;
};

Layers.prototype.remove = function (layer) {
  return this._layers.splice(this._layers.indexOf(layer), 1);
};

Layers.prototype.size = function () {
  return this._layers.length;
};

Layers.prototype.indexOf = function (layer) {
  return this._layers.indexOf(layer);
};

Layers.prototype.contains = function (layer) {
  return this._layers.indexOf(layer) >= 0;
};

Layers.prototype.findById = function (layerId) {
  return _.find(this._layers, function (layer) {
    return layer.getId() === layerId;
  }, this);
};

Layers.prototype.toArray = function () {
  return this._layers;
};

Layers.prototype.move = function (layer, toIndex) {
  var fromIndex = this._layers.indexOf(layer);
  if (fromIndex >= 0 && fromIndex !== toIndex) {
    this._layers.splice(toIndex, 0, this._layers.splice(fromIndex, 1)[0]);
  }
};

module.exports = Layers;
