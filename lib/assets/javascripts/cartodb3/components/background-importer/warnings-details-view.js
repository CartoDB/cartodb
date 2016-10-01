var CoreView = require('backbone/core-view');
var partialImportDetailsTemplate = require('./warning-partial-import-details.tpl');
var tooManyFilesDetailsTemplate = require('./warning-too-many-files-details.tpl');
var tooManyRowsConnectorTemplate = require('./warning-too-many-rows-connector-details.tpl');

/**
 * Error details view, to be used together with an error object from an import model.
 *
 */

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.warnings) throw new Error('warnings is required');

    this._userModel = this.options.userModel;
    this._warnings = this.options.warnings;
  },

  render: function () {
    var warnings = this._warnings;
    var template = this._getTemplate(warnings);

    this.$el.html(
      template({
        userMaxLayers: warnings.user_max_layers,
        maxTablesPerImport: warnings.max_tables_per_import,
        maxRowsPerConnectorImport: warnings.max_rows_per_connection
      })
    );

    return this;
  },

  _getTemplate: function (warnings) {
    if (warnings.user_max_layers && warnings.max_tables_per_import) {
      return (warnings.user_max_layers < warnings.max_tables_per_import) ? partialImportDetailsTemplate : tooManyFilesDetailsTemplate;
    } else if (warnings.user_max_layers) {
      return partialImportDetailsTemplate;
    } else if (warnings.max_tables_per_import) {
      return tooManyFilesDetailsTemplate;
    } else if (warnings.max_rows_per_connection) {
      return tooManyRowsConnectorTemplate;
    }
  }
});
