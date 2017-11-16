var Base = require('./base');
var CartoDBLayer = require('../../../geo/map/cartodb-layer');
var SourceBase = require('../source/base');
var StyleBase = require('../style/base');

/**
 * Represent a layer Object.
 * 
 * @param {object} source - The source where the layer will fetch the data.
 * @param {carto.style.CartoCSS} style - A CartoCSS object with the layer styling.
 * @param {object} [options]
 * @param {Array<string>} [options.featureClickColumns=[]] - Columns that will be available for `featureClick` events. 
 * @param {Array<string>} [options.featureOverColumns=[]] - Columns that will be available for `featureOver` events.
 *
 * @param {carto.source.Base} source - The source where the layer will fetch the data.
 * @param {carto.style.Base} style - A CartoCSS object with the layer styling.
 *
 * @fires carto.layer.Layer.FeatureEvent
 * 
 * @example 
 * 
 * // no options
 * new carto.layer.Layer(citiesSource, citiesStyle);
 *
 * @example
 *
 * // with options
 * new carto.layer.Layer(citiesSource, citiesStyle, {
 *   featureClickColumns: [ 'name', 'population' ],
 *   featureOverColumns: [ 'name' ]
 * });
 * 
 * @constructor
 * @extends carto.layer.Base
 * @api
 */
function Layer (source, style, options) {
  options = options || {};

  _checkSource(source);
  _checkStyle(style);

  this._engine = undefined;
  this._internalModel = undefined;

  this._source = source;
  this._style = style;
  this._visible = true;
  this._featureClickColumns = options.featureClickColumns || [];
  this._featureOverColumns = options.featureOverColumns || [];

  Base.apply(this, arguments);
}

Layer.prototype = Object.create(Base.prototype);

/**
 * Set a new style for this layer.
 * 
 * @param {carto.style.CartoCSS} New style
 * @return {carto.layer.Layer} this
 * 
 * @api
 */
Layer.prototype.setStyle = function (style, opts) {
  var prevStyle = this._style;
  _checkStyle(style);
  opts = opts || {};
  this._style = style;
  if (this._internalModel) {
    this._internalModel.set('cartocss', style.toCartoCSS());
  }
  if (prevStyle !== style) {
    this.trigger('styleChanged', this);
  }
  return this;
};

/**
 * Get the current style for this layer.
 * 
 * @return {carto.style.CartoCSS} Current style.
 *
 * @api
 */
Layer.prototype.getStyle = function () {
  return this._style;
};

/**
 * Set a new source for this layer.
 * 
 * A source and a layer must belong to the same client so you can't 
 * add a source belonging to a different client.
 * 
 * @param {carto.source.Dataset|carto.source.SQL} source New source
 * @return {carto.layer.Layer} this
 *
 * @api
 */
Layer.prototype.setSource = function (source) {
  var prevSource = this._source;
  _checkSource(source);
  if (this._internalModel) {
    // If the source already has an engine and is different from the layer's engine throw an error.
    if (source.$getEngine() && source.$getEngine() !== this._internalModel._engine) {
      throw new Error('A layer can\'t have a source which belongs to a different client');
    }
    this._internalModel.set('source', source.$getInternalModel());
  }
  this._source = source;
  if (prevSource !== source) {
    this.trigger('sourceChanged', this);
  }
  return this;
};

/**
 * Get the current source for this layer
 * 
 * @return {carto.source.Dataset|carto.source.SQL} Current source.
 *
 * @api
 */
Layer.prototype.getSource = function () {
  return this._source;
};

/**
 * Set new columns for `featureClick` events
 * 
 * @param {Array<string>} columns An array containing column names.
 * @return {carto.layer.Layer} this
 *
 * @api
 */
Layer.prototype.setFeatureClickColumns = function (columns) {
  this._featureClickColumns = columns;
  if (this._internalModel) {
    this._internalModel.infowindow.update(_getInteractivityFields(columns));
  }

  return this;
};

/**
 * Return the columns available in `featureClicked` events.
 * 
 * @return  {Array<string>} Column names available in `featureClicked` events
 *
 * @api
 */
Layer.prototype.getFeatureClickColumns = function (columns) {
  return this._featureClickColumns;
};

Layer.prototype.hasFeatureClickColumns = function (columns) {
  return this.getFeatureClickColumns().length > 0;
};

/**
 * Set new columns for `featureOver` events
 * 
 * @param {Array<string>} columns An array containing column names
 * @return {carto.layer.Layer} this
 *
 * @api
 */
Layer.prototype.setFeatureOverColumns = function (columns) {
  this._featureOverColumns = columns;
  if (this._internalModel) {
    this._internalModel.tooltip.update(_getInteractivityFields(columns));
  }

  return this;
};

/**
 * Return the columns available in `featureOver` events.
 * 
 * @return  {Array<string>} Column names available in `featureOver` events
 *
 * @api
 */
Layer.prototype.getFeatureOverColumns = function (columns) {
  return this._featureOverColumns;
};

Layer.prototype.hasFeatureOverColumns = function (columns) {
  return this.getFeatureOverColumns().length > 0;
};

/**
 * Hides the layer.
 * @return {carto.layer.Layer} this
 * @api
 */
Layer.prototype.hide = function () {
  var prevStatus = this._visible;
  this._visible = false;
  if (this._internalModel) {
    this._internalModel.set('visible', false);
  }
  if (prevStatus) {
    this.trigger('visibilityChanged', false);
  }
  return this;
};

/**
 * Shows the layer.
 *
 * @return {carto.layer.Layer} this
 * @api
 */
Layer.prototype.show = function () {
  var prevStatus = this._visible;
  this._visible = true;
  if (this._internalModel) {
    this._internalModel.set('visible', true);
  }
  if (!prevStatus) {
    this.trigger('visibilityChanged', false);
  }
  return this;
};

/**
 * Change the layer's visibility.
 * @return {carto.layer.Layer} this
 */
Layer.prototype.toggle = function () {
  return this.isVisible() ? this.hide() : this.show();
};

/**
 * Return true if the layer is visible and false when not visible.
 * 
 * @return {boolean} - A boolean value indicating the layer's visibility.
 * @api
 */
Layer.prototype.isVisible = function () {
  return this._visible;
};

/**
 * Return `true` if the layer is not visible and false when visible.
 * 
 * @return {boolean} - A boolean value indicating the layer's visibility.
 * @api
 */
Layer.prototype.isHidden = function () {
  return !this.isVisible();
};

// Private functions.

Layer.prototype._createInternalModel = function (engine) {
  return new CartoDBLayer({
    id: this._id,
    source: this._source.$getInternalModel(),
    cartocss: this._style.toCartoCSS(),
    visible: this._visible,
    infowindow: _getInteractivityFields(this._featureClickColumns),
    tooltip: _getInteractivityFields(this._featureOverColumns)
  }, { engine: engine });
};

// Internal functions.

Layer.prototype.$setEngine = function (engine) {
  if (this._engine) {
    return;
  }
  this._engine = engine;
  this._source.$setEngine(engine);
  if (!this._internalModel) {
    this._internalModel = this._createInternalModel(engine);
  }
};

// Scope functions

/**
 * Transform the columns array into the format expected by the CartoDBLayer.
 */
function _getInteractivityFields (columns) {
  var fields = columns.map(function (column, index) {
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

function _checkStyle (style) {
  if (!(style instanceof StyleBase)) {
    throw new TypeError('The given object is not a valid style. See "carto.style.Base"');
  }
}

function _checkSource (source) {
  if (!(source instanceof SourceBase)) {
    throw new TypeError('The given object is not a valid source. See "carto.source.Base"');
  }
}
/**
 * @typedef {Object} LatLng
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * 
 * @api
 */

module.exports = Layer;
