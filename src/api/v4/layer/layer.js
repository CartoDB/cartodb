var _ = require('underscore');
var Base = require('./base');
var CartoDBLayer = require('../../../geo/map/cartodb-layer');
var SourceBase = require('../source/base');
var StyleBase = require('../style/base');
var CartoError = require('../error-handling/carto-error');
var CartoValidationError = require('../error-handling/carto-validation-error');
var EVENTS = require('../events');
var metadataParser = require('./metadata/parser');

/**
 * Represents a layer Object.
 *
 * A layer is the primary way to visualize geospatial data.
 *
 * To create a layer a {@link carto.source.Base|source} and {@link carto.style.Base|styles}
 * are required:
 *
 * - The {@link carto.source.Base|source} is used to know **what** data will be displayed in the Layer.
 * - The {@link carto.style.Base|style} is used to know **how** to draw the data in the Layer.
 *
 * A layer alone won't do too much. In order to get data from the CARTO server you must add the Layer to a {@link carto.Client|client}.
 *
 * ```
 * // Create a layer. Remember this won't do anything unless the layer is added to a client.
 * const layer = new carto.layer.Layer(source, style);
 *```
 *
 * @param {carto.source.Base} source - The source where the layer will fetch the data
 * @param {carto.style.CartoCSS} style - A CartoCSS object with the layer styling
 * @param {object} [options]
 * @param {Array<string>} [options.featureClickColumns=[]] - Columns that will be available for `featureClick` events
 * @param {boolean} [options.visible=true] - A boolean value indicating the layer's visibility
 * @param {Array<string>} [options.featureOverColumns=[]] - Columns that will be available for `featureOver` events
 * @param {carto.layer.Aggregation} [options.aggregation={}] - Specify {@link carto.layer.Aggregation|aggregation } options
 * @param {string} [options.id] - An unique identifier for the layer
 * @fires metadataChanged
 * @fires featureClicked
 * @fires featureOut
 * @fires featureOver
 * @fires error
 * @example
 * const citiesSource = new carto.source.SQL('SELECT * FROM cities');
 * const citiesStyle = new carto.style.CartoCSS(`
 *   #layer {
 *     marker-fill: #FABADA;
 *     marker-width: 10;
 *   }
 * `);
 * // Create a layer with no options
 * new carto.layer.Layer(citiesSource, citiesStyle);
 * @example
 * const citiesSource = new carto.source.SQL('SELECT * FROM cities');
 * const citiesStyle = new carto.style.CartoCSS(`
 *   #layer {
 *     marker-fill: #FABADA;
 *     marker-width: 10;
 *   }
 * `);
 * // Create a layer indicating what columns will be included in the featureOver event.
 * new carto.layer.Layer(citiesSource, citiesStyle, {
 *   featureOverColumns: [ 'name' ]
 * });
 * @example
 * const citiesSource = new carto.source.SQL('SELECT * FROM cities');
 * const citiesStyle = new carto.style.CartoCSS(`
 *   #layer {
 *     marker-fill: #FABADA;
 *     marker-width: 10;
 *   }
 * `);
 * // Create a hidden layer
 * new carto.layer.Layer(citiesSource, citiesStyle, { visible: false });
 * @example
 * // Listen to the event thrown when the mouse is over a feature
 * layer.on('featureOver', featureEvent => {
 *   console.log(`Mouse over city with name: ${featureEvent.data.name}`);
 * });
 * @constructor
 * @extends carto.layer.Base
 * @memberof carto.layer
 * @api
 */
function Layer (source, style, options = {}) {
  Base.apply(this, arguments);

  _checkSource(source);
  _checkStyle(style);

  this._client = undefined;
  this._engine = undefined;
  this._internalModel = undefined;

  this._source = source;
  this._style = style;
  this._visible = _.isBoolean(options.visible) ? options.visible : true;
  this._featureClickColumns = options.featureClickColumns || [];
  this._featureOverColumns = options.featureOverColumns || [];
  this._minzoom = options.minzoom || 0;
  this._maxzoom = options.maxzoom || undefined;
  this._aggregation = options.aggregation || {};

  _validateAggregationColumnsAndInteractivity(this._aggregation.columns, this._featureClickColumns, this._featureOverColumns);
}

Layer.prototype = Object.create(Base.prototype);

/**
 * Set a new style for this layer.
 *
 * @param {carto.style.CartoCSS} style - New style
 * @fires styleChanged
 * @fires error
 * @return {Promise} A promise that will be fulfilled when the style is applied to the layer or rejected with a
 * {@link CartoError} if something goes bad
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
    .catch(_rejectAndTriggerError.bind(this));
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
 * @param {carto.source.Base} source - New source
 * @fires sourceChanged
 * @fires error
 * @return {Promise} A promise that will be fulfilled when the style is applied to the layer or rejected with a
 * {@link CartoError} if something goes bad
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
    .catch(_rejectAndTriggerError.bind(this));
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
 * @param {Array<string>} columns - An array containing column names
 * @fires error
 * @return {Promise}
 * @api
 */
Layer.prototype.setFeatureClickColumns = function (columns) {
  var prevColumns = this._featureClickColumns;
  _checkColumns(columns);
  if (_areColumnsTheSame(columns, prevColumns)) {
    return Promise.resolve();
  }
  // If layer is not instantiated just store the new status
  if (!this._internalModel) {
    this._featureClickColumns = columns;
    return Promise.resolve();
  }
  // Update the internalModel and return a promise
  this._internalModel.infowindow.fields.set(_getInteractivityFields(columns).fields, { silent: true });
  return this._engine.reload()
    .then(function () {
      this._featureClickColumns = columns;
    }.bind(this))
    .catch(_rejectAndTriggerError.bind(this));
};

/**
 * Get the columns available in featureClicked events.
 *
 * @return  {Array<string>} Column names available in featureClicked events
 * @api
 */
Layer.prototype.getFeatureClickColumns = function () {
  return this._featureClickColumns;
};

/**
 * Set new columns for featureOver events.
 *
 * @param {Array<string>} columns - An array containing column names
 * @fires error
 * @return {Promise}
 * @api
 */
Layer.prototype.setFeatureOverColumns = function (columns) {
  var prevColumns = this._featureOverColumns;
  _checkColumns(columns);
  if (_areColumnsTheSame(columns, prevColumns)) {
    return Promise.resolve();
  }
  // If layer is not instantiated just store the new status
  if (!this._internalModel) {
    this._featureOverColumns = columns;
    return Promise.resolve();
  }
  // Update the internalModel and return a promise
  this._internalModel.tooltip.fields.set(_getInteractivityFields(columns).fields, { silent: true });
  return this._engine.reload()
    .then(function () {
      this._featureOverColumns = columns;
    }.bind(this))
    .catch(_rejectAndTriggerError.bind(this));
};

/**
 * Get the columns available in featureOver events.
 *
 * @return  {Array<string>} Column names available in featureOver events
 * @api
 */
Layer.prototype.getFeatureOverColumns = function () {
  return this._featureOverColumns;
};

/**
 * Hides the layer.
 *
 * @fires visibilityChanged
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
 * @fires visibilityChanged
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
 * @fires visibilityChanged
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
 * Return `true` if the layer is not visible and `false` when visible.
 *
 * @return {boolean} - A boolean value indicating the layer's visibility
 * @api
 */
Layer.prototype.isHidden = function () {
  return !this.isVisible();
};

/**
 * Return true if the layer has interactivity.
 *
 * @return {boolean} - A boolean value indicating the layer's interactivity
 * @api
 */
Layer.prototype.isInteractive = function () {
  return this.getFeatureClickColumns().length > 0 || this.getFeatureOverColumns().length > 0;
};

/**
 * Set the layer's order.
 *
 * @param {number} index - new order index for the layer.
 *
 * @return {Promise}
 * @api
 */
Layer.prototype.setOrder = function (index) {
  if (!this._client) {
    return Promise.resolve();
  }
  return this._client.moveLayer(this, index);
};

/**
 * Move the layer to the back.
 *
 * @return {Promise}
 * @api
 */
Layer.prototype.bringToBack = function () {
  return this.setOrder(0);
};

/**
 * Move the layer to the front.
 *
 * @return {Promise}
 * @api
 */
Layer.prototype.bringToFront = function () {
  return this.setOrder(this._client._layers.size() - 1);
};

// Private functions.

Layer.prototype._createInternalModel = function (engine) {
  var internalModel = new CartoDBLayer({
    id: this._id,
    source: this._source.$getInternalModel(),
    cartocss: this._style.getContent(),
    visible: this._visible,
    infowindow: _getInteractivityFields(this._featureClickColumns),
    tooltip: _getInteractivityFields(this._featureOverColumns),
    minzoom: this._minzoom,
    maxzoom: this._maxzoom
  }, {
    engine: engine,
    aggregation: this._aggregation
  });

  internalModel.on('change:meta', function (layer, data) {
    var rules = data.cartocss_meta.rules;
    var styleMetadataList = metadataParser.getMetadataFromRules(rules);

    /**
     * Event fired by {@link carto.layer.Layer} when the style contains any TurboCarto ramp.
     *
     * @typedef {object} carto.layer.MetadataEvent
     * @property {carto.layer.metadata.Base[]} styles - List of style metadata objects
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

Layer.prototype.$setClient = function (client) {
  // Exit if the client is already set or
  // it has a different engine than the layer
  if (this._client || (this._engine && client._engine !== this._engine)) {
    return;
  }
  this._client = client;
};

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

function _checkColumns (columns) {
  if (_.any(columns, function (item) { return !_.isString(item); })) {
    throw new CartoValidationError('layer', 'nonValidColumns');
  }
}

/**
 * Return true when a windshaft error is because a styling error.
 */
function _isStyleError (windshaftError) {
  return windshaftError.message && windshaftError.message.indexOf('style') >= 0;
}

function _rejectAndTriggerError (err) {
  var error = new CartoError(err);
  this.trigger(EVENTS.ERROR, error);
  return Promise.reject(error);
}

function _areColumnsTheSame (newColumns, oldColumns) {
  return newColumns.length === oldColumns.length && _.isEmpty(_.difference(newColumns, oldColumns));
}

/**
 * When there are aggregated columns and interactivity columns they must agree
 */
function _validateAggregationColumnsAndInteractivity (aggregationColumns, clickColumns, overColumns) {
  var aggColumns = (aggregationColumns && Object.keys(aggregationColumns)) || [];

  _validateColumnsConcordance(aggColumns, clickColumns, 'featureClick');
  _validateColumnsConcordance(aggColumns, overColumns, 'featureOver');
}

function _validateColumnsConcordance (aggColumns, interactivityColumns, interactivity) {
  if (interactivityColumns.length > 0 && aggColumns.length > 0) {
    var notInAggregation = _.filter(interactivityColumns, function (clickColumn) {
      return !_.contains(aggColumns, clickColumn);
    });

    if (notInAggregation.length > 0) {
      throw new CartoValidationError('layer', 'wrongInteractivityColumns[' + notInAggregation.join(', ') + ']#' + interactivity);
    }
  }
}

/**
 * @typedef {object} LatLng
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @api
 */

/**
 * Fired when the source has changed. Handler gets a parameter with the new source.
 *
 * @event sourceChanged
 * @type {carto.layer.Layer}
 * @api
 */

/**
 * Fired when the style has changed. Handler gets a parameter with the new style.
 *
 * @event styleChanged
 * @type {carto.layer.Layer}
 * @api
 */

/**
 * Fired when style metadata has changed.
 *
 * @event metadataChanged
 * @type {carto.layer.MetadataEvent}
 * @api
 */

module.exports = Layer;
