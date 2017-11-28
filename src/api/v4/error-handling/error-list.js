var _ = require('underscore');

var ERRORS = {
  windshaft: {
    analysis: {
      'sql-syntax-error': {
        messageRegex: /^syntax error/
      },
      'invalid-dataset': {
        messageRegex: /relation (.+) does not exist/,
        friendlyMessage: 'Invalid dataset name used. Dataset $0 does not exist.'
      }
    },
    generic: {
      'number-column-used-in-time-series': {
        messageRegex: 'function date_part(unknown, integer) does not exist',
        friendlyMessage: 'Your time series column type is number. Please use a date type.'
      },
      'invalid-aggregation-value': {
        messageRegex: 'Invalid aggregation value. Valid ones: auto, minute, hour, day, week, month, quarter, year'
      }
    },
    limit: {
      'over-platform-limits': {
        messageRegex: /^You are over platform's limits/
      },
      'generic-limit-error': {
        messageRegex: /.*/,
        friendlyMessage: 'The server is taking too long to respond, due to poor conectivity or a temporary error with our servers. Please try again soon.'
      }
    },
    tile: {
      'generic-tile-error': {
        messageRegex: /.*/,
        friendlyMessage: 'Some tiles might not be rendering correctly.'
      }
    },
    layer: {
      'column-does-not-exist': {
        messageRegex: /column (.+) does not exist/,
        friendlyMessage: 'Invalid column name. Column $0 does not exist.'
      },
      'unrecognized-rule': {
        messageRegex: /Unrecognized rule: (.+)/,
        friendlyMessage: 'Unrecognized rule "$0"'
      },
      'generic-layer-error': {
        messageRegex: /.*/
      }
    }
  },
  ajax: {

  },
  validation: {
    layer: {
      'non-valid-source': {
        messageRegex: 'nonValidSource',
        friendlyMessage: 'The given object is not a valid source. See "carto.source.Base".'
      },
      'non-valid-style': {
        messageRegex: 'nonValidStyle',
        friendlyMessage: 'The given object is not a valid style. See "carto.style.Base".'
      },
      'source-with-different-client': {
        messageRegex: 'differentSourceClient',
        friendlyMessage: "A layer can't have a source which belongs to a different client"
      }
    }
  }
};

function retrieveFriendlyError (error) {
  var list = ERRORS[error.origin] && ERRORS[error.origin][error.type];
  var entry = null;
  _.each(_.keys(list), function (key) {
    var found = (_.isString(list[key].messageRegex) && list[key].messageRegex === error.message) ||
      (_.isRegExp(list[key].messageRegex) && list[key].messageRegex.test(error.message));
    if (found && !entry) {
      entry = _.extend(list[key], { errorCode: error.origin + ':' + error.type + ':' + key });
    }
  });

  var message = error.message;
  var errorURL = '';
  var errorCode = '';

  if (entry) {
    var friendlyMessage = entry.friendlyMessage || '';
    if (_.isRegExp(entry.messageRegex)) {
      var match = error.message.match(entry.messageRegex);
      if (match && match.length > 1) {
        friendlyMessage = friendlyMessage.replace('$0', match[1]);
      }
    }
    message = friendlyMessage
      ? entry.includeOriginalMessage
        ? friendlyMessage + ' ' + error.message
        : friendlyMessage
      : error.message;

    errorURL = entry.errorURL;
    errorCode = entry.errorCode;
  }

  var friendlyError = _.chain(error)
    .extend({
      message: message,
      errorURL: errorURL,
      errorCode: errorCode
    })
    .omit(['origin', 'type'])
    .value();

  return friendlyError;
}

module.exports = retrieveFriendlyError;
