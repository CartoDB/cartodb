var _ = require('underscore');
var retrieveFriendlyError = require('./error-list');
var UNEXPECTED_ERROR = 'unexpected error';
var GENERIC_ORIGIN = 'generic';

function track (error) {
  if (window.trackJs) {
    try {
      var message = error
        ? error.message + ' - code: ' + error.errorCode
        : JSON.stringify(error);
      window.trackJs.track(new Error(message));
    } catch (exc) {
      // Swallow
    }
  }
}

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
  var cartoError = _.extend({
    message: UNEXPECTED_ERROR,
    type: '',
    origin: GENERIC_ORIGIN
  }, error);

  if (_isWindshaftError(error)) {
    cartoError = transformWindshaftError(error, opts.layers, opts.analysis);
  }
  if (error && error.responseText) {
    cartoError.message = _handleAjaxResponse(error);
    cartoError.origin = 'ajax';
    cartoError.type = error.statusText;
  }

  var friendlyError = retrieveFriendlyError(cartoError);
  track(friendlyError);

  return friendlyError;
}

// Windshaft should have been parsed already 
function _isWindshaftError (error) {
  return error && error.origin === 'windshaft';
}

function transformWindshaftError (error, layers, analysis) {
  var cartoError = {
    message: error.message,
    type: error.type,
    origin: error.origin
  };
  if (error.type === 'layer' && layers) {
    cartoError.layer = layers.findById(error.layerId);
  }
  if (error.type === 'analysis' && analysis) {
    cartoError.source = analysis;
  }

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
 * @event CartoError
 * @type {object}
 * @property {string} message - A short error description.
 * @api
 */
