var cdb = require('cartodb.js-v3');
var partialImportDetailsTemplate = require('./warning-partial-import-details.tpl');
var tooManyFilesDetailsTemplate = require('./warning-too-many-files-details.tpl');

/**
 * Error details view, to be used together with an error object from an import model.
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.warnings) throw new Error('warnings is required');

    this._userModel = this.options.userModel;
    this._warnings = this.options.warnings;
  },

  render: function () {
    var warnings = this._warnings;
    var template;

    if (warnings.user_max_layers ? !warnings.max_tables_per_import : warnings.max_tables_per_import) {
      template = warnings.user_max_layers ? partialImportDetailsTemplate : tooManyFilesDetailsTemplate;
    } else {
      template = (warnings.user_max_layers < warnings.max_tables_per_import) ? partialImportDetailsTemplate : tooManyFilesDetailsTemplate;
    }

    this.$el.html(
      template({
        userMaxLayers: warnings.user_max_layers,
        maxTablesPerImport: warnings.max_tables_per_import
      })
    );

    return this;
  }
});
