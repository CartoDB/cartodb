var Messages = require('./analysis-notification-error-messages.json');

module.exports = {
  extractErrorMessage: function (analysisNode) {
    var message = _t('notifications.analysis.failed', {
      nodeId: analysisNode.get('id').toUpperCase()
    });

    var error = analysisNode.get('error');

    if ((error && error.message) || analysisNode.get('error_message')) {
      var match;
      var errorMessage = (error && error.message) || analysisNode.get('error_message');

      var i = 0;
      var matched = false;

      while (!matched && i < Messages.messages.length) {
        var m = Messages.messages[i];

        if (errorMessage.match(m.match)) {
          if (m.replaceWith) {
            message += ': ' + errorMessage.replace(m.match, _t('notifications.analysis.errors.' + m.replaceWith));
          } else {
            match = errorMessage.match(m.match);
            message += ': ' + match[1];
          }
          matched = true;
        }
        i++;
      }

      if (!matched) {
        message += ': ' + errorMessage;
      }
    }
    return message;
  }
};
