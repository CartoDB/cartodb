var _ = require('underscore');
var Messages = require('./notification-error-messages.json');
var Utils = require('builder/helpers/utils');

var CONTACT_LINK_TEMPLATE;
var SAMPLE_LINK_TEMPLATE;

var getBodyAttributes = function (errorType, layerDefModel) {
  var bodyAttrs = {};
  if (errorType === 'timeout') {
    // if layerDefModel is defined, hen use html code
    // this happens for notification, but not for tooltip errors where we don't want html
    if (layerDefModel != null) {
      CONTACT_LINK_TEMPLATE = _.template("<a href='mailto:<%- mail %>'><%- contact %></a>")({
        contact: _t('notifications.analysis.contact.label'),
        mail: _t('notifications.analysis.contact.mail')
      });

      SAMPLE_LINK_TEMPLATE = _.template("<button class='js-add-analysis u-actionTextColor' data-layer-id='<%- layerId %>'><%- sample %></button>")({
        sample: _t('notifications.analysis.sample'),
        layerId: layerDefModel && layerDefModel.get('id') || ''
      });
    } else {
      CONTACT_LINK_TEMPLATE = _t('notifications.analysis.contact.label');
      SAMPLE_LINK_TEMPLATE = _t('notifications.analysis.sample');
    }

    bodyAttrs = {
      sample: SAMPLE_LINK_TEMPLATE,
      contact: CONTACT_LINK_TEMPLATE
    };
  }

  return bodyAttrs;
};

module.exports = {
  extractErrorFromAnalysisNode: function (analysisNode, layerDefModel) {
    var errorType = 'error';
    var message = _t('notifications.analysis.failed', {
      nodeId: analysisNode.get('id').toUpperCase()
    });

    var error = analysisNode.get('error');

    if ((error && error.message) || analysisNode.get('error_message')) {
      var errorMessage = (error && error.message) || analysisNode.get('error_message');
      var extractedError = this.extractError(errorMessage, layerDefModel);
      message += ': ' + extractedError.message;
      errorType = extractedError.type;
    }

    return { message: message, type: errorType };
  },

  extractError: function (errorMessage, layerDefModel) {
    var errorType;
    var matched = false;
    var message;

    Messages.messages.some(function (m) {
      var errorMessageType = m.replaceWith;
      var regExp = new RegExp(m.match);
      var match = errorMessage.match(regExp);
      var body;

      errorMessage = Utils.removeNewLines(errorMessage);

      if (match) {
        if (errorMessageType) {
          body = _t('notifications.analysis.errors.' + errorMessageType, getBodyAttributes(errorMessageType, layerDefModel));
          message = errorMessage.replace(regExp, body);
        } else {
          message = match[1];
        }
        matched = true;
        errorType = m.errorType;
      }

      return matched;
    });

    return { message: message || errorMessage, type: errorType || 'error' };
  }
};
