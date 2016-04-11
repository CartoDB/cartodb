var cdb = require('cartodb.js-v3');
var partialImportDetailsTemplate = require('./partial-import-details.tpl');
var tooManyFilesDetailsTemplate = require('./too-many-files-details.tpl');

/**
 * Error details view, to be used together with an error object from an import model.
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function () {
    this.warnings = this.options.warnings;
  },

  render: function () {
    var warnings = this.warnings;
    var template;

    // XOR. Only warn user about zip limit if his max_layers limit is larger
    if (warnings.user_max_layers ? !warnings.max_tables_per_import : warnings.max_tables_per_import) {
      template = warnings.user_max_layers ? partialImportDetailsTemplate : tooManyFilesDetailsTemplate;
    } else {
      template = (warnings.user_max_layers < warnings.max_tables_per_import) ? partialImportDetailsTemplate : tooManyFilesDetailsTemplate;
    }

    this.$el.html(
      template({
        warnings: warnings
      })
    );

    return this;
  }
});
