var Messages = require('./notification-error-messages.json');
var Utils = require('../../../../javascripts/cartodb3/helpers/utils');

module.exports = {
  extractErrorFromAnalysisNode: function (analysisNode) {
    var errorType = 'error';
    var message = _t('notifications.analysis.failed', {
      nodeId: analysisNode.get('id').toUpperCase()
    });

    var error = analysisNode.get('error');

    if ((error && error.message) || analysisNode.get('error_message')) {
      var errorMessage = (error && error.message) || analysisNode.get('error_message');
      var extractedError = this.extractError(errorMessage);
      message += ': ' + extractedError.message;
      errorType = extractedError.type;
    }

    return { message: message, type: errorType };
  },

  extractError: function (errorMessage) {
    var errorType;
    var matched = false;
    var message;
    var i = 0;

    while (!matched && i < Messages.messages.length) {
      var m = Messages.messages[i];

      var regExp = new RegExp(m.match);

      errorMessage = Utils.removeNewLines(errorMessage);

      if (errorMessage.match(regExp)) {
        if (m.replaceWith) {
          message = errorMessage.replace(regExp, _t('notifications.analysis.errors.' + m.replaceWith));
        } else {
          var match = errorMessage.match(regExp);
          message = match[1];
        }
        matched = true;
        errorType = m.errorType;
      }
      i++;
    }

    return { message: message || errorMessage, type: errorType || 'error' };
  }
};
