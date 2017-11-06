var Base = require('./base');
var CartoDBLayer = require('../../../geo/map/cartodb-layer');

/**
 *
 * Represent a layer Object.
 *
 * @param {string} [id] - A unique ID for this layer
 * @param {carto.source.Base} source - The source where the layer will fetch the data.
 * @param {carto.style.Base} style - A CartoCSS object with the layer styling.
 *
 * @example
 *
 * new carto.layer.Layer('cities', citiesSource, citiesStyle);
 *
 * @example
 *
 * new carto.layer.Layer(citiesSource, citiesStyle);
 *
 * @constructor
 * @extends carto.layer.Base
 * @memberof carto.layer
 * @api
 */
function Layer (id, source, style) {
  if (typeof style === 'undefined') {
    source = id;
    style = source;
    id = 'fakeId'; // TODO: Generate a unique ID
  }

  this._id = id;
  this._source = source;
  this._style = style;
  this._visible = true;
}

Layer.prototype = Object.create(Base.prototype);

Layer.prototype.setStyle = function (style, opts) {
  opts = opts || {};
  this._style = style;
  if (!this._internalModel) {
    return;
  }
  this._internalModel.set('cartocss', style.toCartoCSS(), { silent: true });
  if (opts.reload === false) {
    return Promise.resolve();
  }
  return this._internalModel._engine.reload();
};

Layer.prototype.hide = function () {
  this._visible = false;
  if (this._internalModel) {
    this._internalModel.hide();
  }
};

Layer.prototype.show = function () {
  this._visible = true;
  if (this._internalModel) {
    this._internalModel.show();
  }
};

Layer.prototype.setSource = function (source) {
  this._source = source;
  if (this._internalModel) {
    this._internalModel.set('source', source);
  }
};

Layer.prototype.$setEngine = function (engine) {
  this._source.$setEngine(engine);
  if (!this._internalModel) {
    this._internalModel = new CartoDBLayer({
      id: this._id,
      source: this._source.$getInternalModel(),
      cartocss: this._style.toCartoCSS(),
      visible: this._visible
    }, { engine: engine });
  }
};

Layer.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = Layer;
