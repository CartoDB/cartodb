module.exports = {
  extractErrorMessage: function (analysisNode) {
    var message = _t('notifications.analysis.failed', {
      nodeId: analysisNode.get('id').toUpperCase()
    });

    var error = analysisNode.get('error');

    if ((error && error.message) || analysisNode.get('error_message')) {
      var match;
      var errorMessage = (error && error.message) || analysisNode.get('error_message');

      if (errorMessage.match(/Exception: (.*)$/)) {
        match = errorMessage.match(/Exception: (.*)$/);
        errorMessage = match[1];
      } else if (errorMessage.match(/REMOTE ERROR: .*Error: (.*?)$/)) {
        match = errorMessage.match(/REMOTE ERROR: .*Error: (.*?)$/);
        errorMessage = match[1];
      }

      message += ': ' + errorMessage;
    }

    return message;
  }
};
