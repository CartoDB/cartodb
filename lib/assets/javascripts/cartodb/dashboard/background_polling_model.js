var BackgroundPollingModel = require('../common/background_polling/background_polling_model');

/**
 *  Background polling model for the dashboard context.
 */
module.exports = BackgroundPollingModel.extend({

  _onImportsStateChange: function (importsModel) {
    if (this._shouldRedirect(importsModel)) {
      this._redirectTo(importsModel.getRedirectUrl(this.user));
      return;
    }

    if (importsModel.hasCompleted()) {
      this.trigger('importCompleted', importsModel, this);
    }
  },

  /**
   * Determines if the user can be redirected after the given
   * import has been completed. The following conditions must be true:
   *   - No imports are still running
   *   - Import has a redirect URL for the given user
   *   - Import was NOT a twitter import
   *   - Number of tables created:
   *     - n if import was a .carto file
   *     - 1 otherwise
   */
  _shouldRedirect: function (importsModel) {
    return !this.importsCollection.isAnyImportRunning() &&
      !importsModel.isTwitterImport() &&
      importsModel.getRedirectUrl(this.user) &&
      (importsModel.getNumberOfTablesCreated() === 1 ||
        importsModel.isCartoImport());
  },

  _redirectTo: function (url) {
    window.location = url;
  }
});
