var retrieveFriendlyError = require('./error-list');
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
function CartoError (error) {
  this.message = UNEXPECTED_ERROR;
  this.type = '';
  this.origin = GENERIC_ORIGIN;

  if (_isWindshaftError(error)) {
    this.message = error.message;
    this.type = error.type;
    this.origin = error.origin;
  }
  if (error && error.responseText) {
    this.message = _handleAjaxResponse(error);
    this.origin = 'ajax';
    this.type = error.statusText;
  }
  if (error && error.message) {
    this.message = error.message;
  }

  return retrieveFriendlyError(this);
}

// Windshaft should have been parsed already 
function _isWindshaftError (error) {
  return error && error.origin === 'windshaft';
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
 * @event CartoError
 * @type {object}
 * @property {string} message - A short error description.
 * @api
 */
