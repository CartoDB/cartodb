var CartoDBLayer = require('../../../geo/map/cartodb-layer');

function Layer (source, style, engine, opts) {
  this._internalLayer = new CartoDBLayer({
    id: opts.id,
    source: source,
    cartocss: style.toCartoCSS()
  }, { engine: engine });
}

Layer.prototype.setStyle = function (style) {
  this._internalLayer.set('cartocss', style.toCartoCSS());
};

Layer.prototype._getInternalLayer = function () {
  return this._internalLayer;
};

Layer.prototype.hide = function () {
  this._internalLayer.hide();
};

Layer.prototype.show = function () {
  this._internalLayer.show();
};

module.exports = Layer;
