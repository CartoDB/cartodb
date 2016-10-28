var _ = require('underscore');
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

      _.each(Messages.messages, function (message) {
        if (message.match && errorMessage.match(message.match)) {
          match = errorMessage.match(message.match);
          errorMessage = match[1];
        } else if (message.replace && errorMessage.match(message.replace)) {
          errorMessage.replace(message.match, message.with);
        }
      }, this);

      message += ': ' + errorMessage;
    }

    return message;
  }
};
