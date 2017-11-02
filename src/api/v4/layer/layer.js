var _ = require('underscore');
var Backbone = require('backbone');
var CartoDBLayer = require('../../../geo/map/cartodb-layer');

/**
 * 
 * Represent a layer Object.
 * 
 * @param {string} [id] - A unique ID for this layer
 * @param {object} source - The source where the layer will fetch the data.
 * @param {carto.style.CartoCSS} style - A CartoCSS object with the layer styling.
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
 * @api
 * @memberof carto.layer
 */
function Layer (id, source, style, options) {
  if (typeof options === 'undefined') {
    source = id;
    style = source;
    options = style;
    id = 'fakeId'; // TODO: Generate a unique ID
  }

  this._engine = undefined;
  this._internalModel = undefined;

  this.id = id;
  this._source = source;
  this._style = style;
  this._visible = true;
  this._featureClickColumns = options.featureClickColumns;
  this._featureOverColumns = options.featureOverColumns;
}

Layer.prototype.setStyle = function (style, opts) {
  opts = opts || {};
  this._style = style;
  this._internalModel.set('cartocss', style.toCartoCSS(), { silent: true });
  return this._reloadEngine();
};

Layer.prototype.setSource = function (source) {
  this._source = source;
  if (this._internalModel) {
    this._internalModel.set('source', source, { silent: true });
  }
  return this._reloadEngine();
};

Layer.prototype.setFeatureClickColumns = function (columns) {
  this._featureClickColumns = columns;
  if (this._internalModel) {
    this._internalModel.infowindow.update(getInteractivityFields(columns), { silent: true });
  }

  return this._reloadEngine();
};

Layer.prototype.setFeatureOverColumns = function (columns) {
  this._featureOverColumns = columns;
  if (this._internalModel) {
    this._internalModel.tooltip.update(getInteractivityFields(columns), { silent: true });
  }

  return this._reloadEngine();
};

Layer.prototype.hide = function () {
  this._visible = false;
  if (this._internalModel) {
    this._internalModel.set('visible', false, { silent: true });
  }

  return this._reloadEngine();
};

Layer.prototype.show = function () {
  this._visible = true;
  if (this._internalModel) {
    this._internalModel.set('visible', true, { silent: true });
  }

  return this._reloadEngine();
};

Layer.prototype.$setEngine = function (engine) {
  if (this._engine) {
    return;
  }
  this._engine = engine;
  this._source.$setEngine(engine);
  this._internalModel = this._createInternalModel(engine);
};

Layer.prototype._createInternalModel = function (engine) {
  return new CartoDBLayer({
    id: this.id,
    source: this._source.$getInternalModel(),
    cartocss: this._style.toCartoCSS(),
    visible: this._visible,
    infowindow: getInteractivityFields(this._featureClickColumns),
    tooltip: getInteractivityFields(this._featureOverColumns)
  }, { engine: engine });
};

Layer.prototype.$getInternalModel = function () {
  return this._internalModel;
};

Layer.prototype._reloadEngine = function () {
  if (this._engine) {
    return this._engine.reload();
  }

  return Promise.resolve();
};

_.extend(Layer.prototype, Backbone.Events);

function getInteractivityFields (columns) {
  var fields = _.map(columns, function (column, index) {
    return {
      name: column,
      title: true,
      position: index
    };
  });

  return {
    fields: fields
  };
}

module.exports = Layer;
