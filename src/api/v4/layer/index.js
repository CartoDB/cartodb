var CartoDBLayer = require('../../../geo/map/cartodb-layer');

function Layer (source, style, engine, opts) {
  this._internalLayer = new CartoDBLayer({
    id: opts.id,
    source: source,
    cartocss: style.toCartoCSS()
  }, { engine: engine });
}

Layer.prototype.setStyle = function (style, silent) {
  if (typeof style !== 'string') {
    style = style.toCartoCSS();
  }
  this._internalLayer.set('cartocss', style, { silent: true });
  if (!silent) {
    return this._internalLayer._engine.reload();
  }
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

Layer.prototype.setSource = function (node) {
  this._internalLayer.set('source', node);
};

module.exports = Layer;
