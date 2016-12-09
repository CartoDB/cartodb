var _ = require('underscore');
var DEFAULT_ERROR_MSG = '';

/**
 *  Return error message when backend request fails
 *  It tries to get responseText > errors and error arrays, if not gets `statusText`.
 */

module.exports = function (e) {
  if (!e) { throw new Error('error is required'); }

  try {
    var responseText = e.responseText && e.responseText.trim() && JSON.parse(e.responseText);
    var errorMessage = e.statusText || DEFAULT_ERROR_MSG;

    if (responseText) {
      var errors = _.compact(
        _.map(['errors', 'error'], function (type) {
          return responseText[type] && responseText[type].join(', ');
        })
      );
      errorMessage = errors.join(', ');
    }

    return errorMessage;
  } catch (err) {
    return DEFAULT_ERROR_MSG;
  }
};
