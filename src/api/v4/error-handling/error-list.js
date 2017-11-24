var _ = require('underscore');

var ERRORS = {
  windshaft: {
    analysis: {
      'sql-syntax-error': {
        messageRegex: /^syntax error/,
        errorURL: '',
        errorCode: 900
      },
      'invalid-dataset': {
        messageRegex: /relation (.+) does not exist/,
        friendlyMessage: 'Invalid dataset name used.',
        includeOriginalMessage: true
      }
    },
    generic: {
      'number-column-used-in-time-series': {
        messageRegex: 'function date_part(unknown, integer) does not exist',
        friendlyMessage: 'Your time series column type is number. Please use a date type.',
        errorURL: '',
        errorCode: 1000
      },
      'invalid-aggregation-value': {
        messageRegex: 'Invalid aggregation value. Valid ones: auto, minute, hour, day, week, month, quarter, year',
        errorURL: '',
        errorCode: 1001
      }
    }
  },
  ajax: {

  }
};

function retrieveFriendlyError (error) {
  var list = ERRORS[error.origin] && ERRORS[error.origin][error.type];
  var friendlyErrors = _.filter(list, function (friendlyError) {
    if (_.isString(friendlyError.messageRegex)) {
      return friendlyError.messageRegex === error.message;
    } else if (_.isRegExp(friendlyError.messageRegex)) {
      return friendlyError.messageRegex.test(error.message);
    }
    return false;
  });

  var transformedError = {
    message: error.message,
    errorURL: '',
    errorCode: ''
  };

  if (friendlyErrors.length > 0) {
    var message = friendlyErrors[0].friendlyMessage
      ? friendlyErrors[0].includeOriginalMessage
        ? friendlyErrors[0].friendlyMessage + ' ' + error.message
        : friendlyErrors[0].friendlyMessage
      : error.message;

    transformedError = {
      message: message,
      errorURL: friendlyErrors[0].errorURL,
      errorCode: friendlyErrors[0].errorCode
    };
  }

  return transformedError;
}

module.exports = retrieveFriendlyError;
