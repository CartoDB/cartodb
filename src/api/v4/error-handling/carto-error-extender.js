var _ = require('underscore');
var ERROR_LIST = require('./error-list');

/**
 * Returns two parameters to enrich a CartoError.
 * - friendlyMessage: A easy to understand error description.
 * - errorCode: Am unique error code
 * 
 * @param {CartoError} cartoError
 * 
 * @returns {object} - An object containing a friendly message and a errorCode
 */
function getExtraFields (cartoError) {
  var errorlist = _getErrorList(cartoError);
  var listedError = _getListedError(cartoError, errorlist);

  return {
    friendlyMessage: listedError.friendlyMessage,
    errorCode: listedError.errorCode
  };
}

/**
 * 
 * @param {CartoError} cartoError 
 */
function _getErrorList (cartoError) {
  return ERROR_LIST[cartoError.origin] && ERROR_LIST[cartoError.origin][cartoError.type];
}

/**
 * Get the listed error from a cartoError, if no listedError is found return a generic
 * unknown error.
 * @param {CartoError} cartoError 
 */
function _getListedError (cartoError, errorList) {
  var errorListkeys = _.keys(errorList);
  var key;
  for (var i = 0; i < errorListkeys.length; i++) {
    key = errorListkeys[i];
    if (!(errorList[key].messageRegex instanceof RegExp)) {
      throw new Error('MessageRegex on ' + key + ' is not a RegExp.');
    }
    if (errorList[key].messageRegex.test(cartoError.message)) {
      return {
        friendlyMessage: _replaceRegex(cartoError, errorList[key]),
        errorCode: _buildErrorCode(cartoError, key)
      };
    }
  }

  // When cartoError not found return generic values
  return {
    friendlyMessage: cartoError.message || '',
    errorCode: _buildErrorCode(cartoError, 'unknown-error')
  };
}

/**
 * Replace $0 and $1 with the proper paramter in the listedError regex to build a friendly message
 */
function _replaceRegex (cartoError, listedError) {
  if (!listedError.friendlyMessage) {
    return cartoError.message;
  }
  var match = cartoError.message && cartoError.message.match(listedError.messageRegex);
  if (match && match.length > 1) {
    var replaced = listedError.friendlyMessage.replace('$0', match[1]);
    if (match.length > 2) {
      replaced = replaced.replace('$1', match[2]);
    }
    return replaced;
  }
  return listedError.friendlyMessage;
}

/**
 * Generate an unique string that represents a cartoError
 * @param {cartoError} cartoError 
 * @param {string} key 
 */
function _buildErrorCode (cartoError, key) {
  var fragments = [];
  fragments.push(cartoError && cartoError.origin);
  fragments.push(cartoError && cartoError.type);
  fragments.push(key);
  fragments = _.compact(fragments);

  return fragments.join(':');
}

module.exports = { getExtraFields: getExtraFields };
