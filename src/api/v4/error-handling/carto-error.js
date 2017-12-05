var errorExtender = require('./carto-error-extender');
var errorTracker = require('./error-tracker');

var UNEXPECTED_ERROR = 'unexpected error';
var GENERIC_ORIGIN = 'generic';

/**
 * Build a cartoError from a generic error.
 * @constructor
 * 
 * @return {CartoError} A well formed object representing the error.
 *
 * @api
 */
function CartoError (error, opts) {
  opts = opts || {};
  var cartoError = Object.create(Error.prototype);
  cartoError.message = (error && error.message) || UNEXPECTED_ERROR;
  cartoError.origin = (error && error.origin) || GENERIC_ORIGIN;
  cartoError.type = (error && error.type) || '';

  if (_isWindshaftError(error)) {
    cartoError = _transformWindshaftError(error, opts.layers, opts.analysis);
  }

  if (_isAjaxError(error)) {
    cartoError = _transformAjaxError(error);
  }

  // Add extra fields
  var extraFields = errorExtender.getExtraFields(cartoError);
  cartoError.message = extraFields.friendlyMessage;
  cartoError.errorCode = extraFields.errorCode;

  // Final properties
  cartoError.name = 'CartoError';
  cartoError.stack = (new Error()).stack;
  cartoError.originalError = error;

  errorTracker.track(cartoError);

  return cartoError;
}

// Windshaft should have been parsed already 
function _isWindshaftError (error) {
  return error && error.origin === 'windshaft';
}

function _isAjaxError (error) {
  return error && error.responseText;
}

function _transformWindshaftError (error, layers, analysis) {
  var cartoError = Object.create(Error.prototype);
  cartoError.message = error.message;
  cartoError.origin = error.origin;
  cartoError.type = error.type;

  if (error.type === 'layer' && layers) {
    cartoError.layer = layers.findById(error.layerId);
  }
  if (error.type === 'analysis' && analysis) {
    cartoError.source = analysis;
  }

  return cartoError;
}

function _transformAjaxError (error) {
  var cartoError = Object.create(Error.prototype);
  cartoError.message = _handleAjaxResponse(error);
  cartoError.origin = 'ajax';
  cartoError.type = error.statusText;

  return cartoError;
}

function _handleAjaxResponse (error) {
  var errorMessage = '';

  try {
    var parsedError = JSON.parse(error.responseText);
    errorMessage = parsedError.errors[0];
  } catch (exc) {
    // Swallow parse error
  }
  return errorMessage || UNEXPECTED_ERROR;
}

module.exports = CartoError;

/**
* Represents an error in the carto library.
 * 
 * Some actions like adding a layer to a map will trigger a **reload cycle**
 * if some error happens during this reload cycle will be captured and transformed into a 
 * `CartoError`.
 * 
 * The cartoErrors can be obtained listening to the client {@link carto.events|error events} `client.on(carto.events.ERROR, callback);` 
 * or through any async action events.
 * 
 * Promises are also rejected with a cartoError.
 * @example
 * // Listen when a layer has been added or there has been an error.
 * client.addLayer(layerWithErrors)
 *  .then(()=> console.log('Layer added succesfully'))
 *  .catch(cartoError => console.error(cartoError.message))
 * @example 
 * // Events also will be registered here when the map changes.
 * client.on(carto.events.SUCCESS, function () {
 *  console.log('Client reloaded');
 * });
 * 
 * client.on(carto.events.ERROR, function (clientError) {
 *  console.error(clientError.message);
 * });
 * @typedef CartoError
 * @property {string} message - A short error description
 * @property {string} name - The name of the error "CartoError"
 * @property {string} origin - Where the error was originated: 'windshaft' | 'ajax' | 'validation'
 * @property {object} originalError - An object containing the internal/original error
 * @property {object} stack - Error stack trace
 * @property {string} type - Error type
 * @api
 */
