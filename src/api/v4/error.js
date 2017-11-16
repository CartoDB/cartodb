var UNEXPECTED_ERROR = 'unexpected error';

/**
 * Build a cartoError from a generic error
 * @constructor
 * 
 * @return {CartoError} A well formed object representing the error.
 *
 * @api
 */
function CartoError (error) {
  if (_isWindshaftError(error)) {
    this.message = error.errors[0];
    return this;
  }
  if (error && error.message) {
    this.message = error.message;
    return this;
  }
  if (error && error.responseText) {
    this.message = _handleAjaxResponse(error);
    return this;
  }

  this.message = UNEXPECTED_ERROR;
}

function _isWindshaftError (error) {
  return error && error.errors_with_context;
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
 * 
 * Represents an error in the carto library.
 * 
 * Some actions like adding a layer to a map will trigger a **reload cycle**
 * if some error happens during this reload cycle will be captured and transformed into a 
 * `CartoError`.
 * 
 * The cartoErrors can be obtained listening to the client {@link carto.events|error events} `client.on(carto.events.ERROR, callback);` 
 * or through the promise returned by each async action.
 * 
 * @example
 * // Listen when a layer has been added or there has been an error.
 * client.addLayer(layerWithErrors)
 *  .then(()=> console.log('Layer added succesfully'))
 *  .catch(cartoError => console.error(cartoError.message))
 * 
 * @example 
 * // Events also will be registered here when the map changes.
 * client.on(carto.events.SUCCESS, function () {
 *  console.log('Client reloaded');
 * });
 * 
 * client.on(carto.events.ERROR, function (clientError) {
 *  console.error(clientError.message);
 * });
 * 
 * @typedef CartoError
 * @property {string} message - A short error description.
 * @api
 */
