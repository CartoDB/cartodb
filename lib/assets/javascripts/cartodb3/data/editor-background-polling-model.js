var BackgroundPollingModel = require('./background-importer/background-polling-model');

/**
 *  Background polling model for the editor context.
 */

module.exports = BackgroundPollingModel.extend({
  _onImportsStateChange: function (importsModel) {
    if (importsModel.hasCompleted()) {
      this.trigger('importCompleted', importsModel, this);
    }
  }
});
