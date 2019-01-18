var CartoError = require('./carto-error');

/**
 * Utility to build a cartoError related to validation errors.
 * @constructor
 * 
 * @return {CartoError} A well formed object representing the error.
 */
function CartoValidationError (type, message, opts) {
  return new CartoError({
    origin: 'validation',
    type: type,
    message: message
  }, opts);
}

module.exports = CartoValidationError;
