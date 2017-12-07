var Base = require('./base');
var CartoDBLayer = require('../../../geo/map/cartodb-layer');
var SourceBase = require('../source/base');
var StyleBase = require('../style/base');
var CartoError = require('../error-handling/carto-error');
var CartoValidationError = require('../error-handling/carto-validation-error');
var EVENTS = require('../events');
var metadataParser = require('./metadata/parser');

/**
 * Represent a layer Object.
 *
 *
 * /...
 *
 * The `styleChanged` event is triggered **only** when the style object is changed. Mutations in the style itself are ignored by this event.
 *
 * @param {object} source - The source where the layer will fetch the data
 * @param {carto.style.CartoCSS} style - A CartoCSS object with the layer styling
 * @param {object} [options]
 * @param {Array<string>} [options.featureClickColumns=[]] - Columns that will be available for `featureClick` events
 * @param {Array<string>} [options.featureOverColumns=[]] - Columns that will be available for `featureOver` events
 * @fires carto.layer.FeatureEvent
 * @fires carto.layer.sourceChanged
 * @fires carto.layer.styleChanged
 * @fires carto.layer.MetadataEvent
 * @example
 * // no options
 * new carto.layer.Layer(citiesSource, citiesStyle);
 * @example
 * // with options
 * new carto.layer.Layer(citiesSource, citiesStyle, {
 *   featureClickColumns: [ 'name', 'population' ],
 *   featureOverColumns: [ 'name' ]
 * });
 * @constructor
 * @extends carto.layer.Base
 * @memberof carto.layer
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
 * @fires carto.layer.Layer.styleChanged
 * @return {Promise} A promise that will be fulfilled when the style is applied to the layer or rejected with a
 * {@link CartoError} if something goes bad
 * @api
 */
Layer.prototype.setStyle = function (style, opts) {
  var prevStyle = this._style;
  _checkStyle(style);
  opts = opts || {};
  if (prevStyle === style) {
    return Promise.resolve();
  }
  if (!this._internalModel) {
    this._style = style;
    this.trigger('styleChanged', this);
    return Promise.resolve();
  }
  // If style has an engine and is different from the layer`s engine throw an error
  if (style.$getEngine() && style.$getEngine() !== this._internalModel._engine) {
    throw new CartoValidationError('layer', 'differentStyleClient');
  }
  // If style has no engine, set the layer engine in the style.
  if (!style.$getEngine()) {
    style.$setEngine(this._engine);
  }

  this._internalModel.set('cartocss', style.getContent(), { silent: true });
  return this._engine.reload()
    .then(function () {
      this._style = style;
      this.trigger('styleChanged', this);
    }.bind(this))
    .catch(function (err) {
      var error = new CartoError(err);
      this.trigger(EVENTS.ERROR, error);
      return Promise.reject(error);
    }.bind(this));
};

/**
 * Get the current style for this layer.
 *
 * @return {carto.style.CartoCSS} Current style
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
 * @param {carto.source.Base} source New source
 * @fires carto.layer.Layer.sourceChanged
 * @return {Promise} A promise that will be fulfilled when the style is applied to the layer or rejected with a
 * {@link CartoError} if something goes bad
 * @api
 */
Layer.prototype.setSource = function (source) {
  var prevSource = this._source;
  _checkSource(source);
  if (prevSource === source) {
    return Promise.resolve();
  }
  // If layer is not instantiated just store the new status
  if (!this._internalModel) {
    this._source = source;
    this.trigger('sourceChanged', this);
    return Promise.resolve();
  }
  // If layer has been instantiated
  // If the source already has an engine and is different from the layer's engine throw an error.
  if (source.$getEngine() && source.$getEngine() !== this._internalModel._engine) {
    throw new CartoValidationError('layer', 'differentSourceClient');
  }
  // If source has no engine use the layer engine.
  if (!source.$getEngine()) {
    source.$setEngine(this._engine);
  }
  // Update the internalModel and return a promise
  this._internalModel.set('source', source.$getInternalModel(), { silent: true });
  return this._engine.reload()
    .then(function () {
      this._source = source;
      this.trigger('sourceChanged', this);
    }.bind(this))
    .catch(function (err) {
      var error = new CartoError(err);
      this.trigger(EVENTS.ERROR, error);
      return Promise.reject(error);
    }.bind(this));
};

/**
 * Get the current source for this layer.
 *
 * @return {carto.source.Base} Current source
 * @api
 */
Layer.prototype.getSource = function () {
  return this._source;
};

/**
 * Set new columns for featureClick events.
 *
 * @param {Array<string>} columns An array containing column names
 * @return {carto.layer.Layer} this
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
 * Get the columns available in featureClicked events.
 *
 * @return  {Array<string>} Column names available in featureClicked events
 * @api
 */
Layer.prototype.getFeatureClickColumns = function (columns) {
  return this._featureClickColumns;
};

/**
 * Set new columns for featureOver events.
 *
 * @param {Array<string>} columns An array containing column names
 * @return {carto.layer.Layer} this
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
 * Get the columns available in featureOver events.
 *
 * @return  {Array<string>} Column names available in featureOver events
 * @api
 */
Layer.prototype.getFeatureOverColumns = function (columns) {
  return this._featureOverColumns;
};

/**
 * Hides the layer.
 *
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
 *
 * @return {carto.layer.Layer} this
 */
Layer.prototype.toggle = function () {
  return this.isVisible() ? this.hide() : this.show();
};

/**
 * Return true if the layer is visible and false when not visible.
 *
 * @return {boolean} - A boolean value indicating the layer's visibility
 * @api
 */
Layer.prototype.isVisible = function () {
  return this._visible;
};

/**
 * Return `true` if the layer is not visible and false when visible.
 *
 * @return {boolean} - A boolean value indicating the layer's visibility
 * @api
 */
Layer.prototype.isHidden = function () {
  return !this.isVisible();
};

Layer.prototype.isInteractive = function () {
  return this.getFeatureClickColumns().length > 0 || this.getFeatureOverColumns().length > 0;
};

// Private functions.

Layer.prototype._createInternalModel = function (engine) {
  var internalModel = new CartoDBLayer({
    id: this._id,
    source: this._source.$getInternalModel(),
    cartocss: this._style.getContent(),
    visible: this._visible,
    infowindow: _getInteractivityFields(this._featureClickColumns),
    tooltip: _getInteractivityFields(this._featureOverColumns)
  }, { engine: engine });

  internalModel.on('change:meta', function (layer, data) {
    var rules = data.cartocss_meta.rules;
    var styleMetadataList = metadataParser.getMetadataFromRules(rules);
    /**
     *
     * Events triggered by {@link carto.layer.Layer} when the style contains Turbocarto ramps
     *
     * @event carto.layer.MetadataEvent
     * @property {carto.layer.metadata.Base[]} styles - List of style metadata objects
     *
     * @api
     */
    var metadata = { styles: styleMetadataList };
    this.trigger('metadataChanged', metadata);
  }, this);

  internalModel.on('change:error', function (model, value) {
    if (value && _isStyleError(value)) {
      this._style.$setError(new CartoError(value));
    } else if (value) {
      this.trigger(EVENTS.ERROR, new CartoError(value));
    }
  }, this);

  return internalModel;
};

// Internal functions.

Layer.prototype.$setEngine = function (engine) {
  if (this._engine) {
    return;
  }
  this._engine = engine;
  this._source.$setEngine(engine);
  this._style.$setEngine(engine);
  if (!this._internalModel) {
    this._internalModel = this._createInternalModel(engine);
    this._style.on('$changed', function (style) {
      this._internalModel.set('cartocss', style.getContent(), { silent: true });
    }, this);
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
    throw new CartoValidationError('layer', 'nonValidStyle');
  }
}

function _checkSource (source) {
  if (!(source instanceof SourceBase)) {
    throw new CartoValidationError('layer', 'nonValidSource');
  }
}

/**
 * Return true when a windshaft error is because a styling error.
 */
function _isStyleError (windshaftError) {
  return windshaftError.message && windshaftError.message.indexOf('style') >= 0;
}

/**
 * @typedef {Object} LatLng
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 *
 * @api
 */

/**
 * Event triggered when the source of the layer changes.
 *
 * Contains a single argument with the Layer where the source has changed.
 *
 * @event carto.layer.sourceChanged
 * @type {carto.layer.Layer}
 * @api
 */

/**
 * Event triggered when the style of the layer changes.
 *
 * Contains a single argument with the Layer where the style has changed.
 *
 * @event carto.layer.styleChanged
 * @type {carto.layer.Layer}
 * @api
 */

/**
 * Event triggered when the style metadata of the layer changes.
 *
 * Contains a list of metadata objects.
 *
 * @event carto.layer.metadataChanged
 * @type {carto.layer.MetadataEvent}
 * @api
 */

module.exports = Layer;
