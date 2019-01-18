var cdb = require('cartodb.js-v3');

/**
 * Error details view, to be used together with an error object from an import model.
 *
 */

module.exports = cdb.core.View.extend({
  _TEMPLATES: {
    'partial_import': 'common/views/partial_import_details',
    'too_many_files': 'common/views/too_many_files_details',
    'too_many_rows_connection': 'common/views/too_many_rows_connection_details'
  },

  initialize: function() {
    this.warnings = this.options.warnings;
  },

  render: function() {
    var warnings = this.warnings;

    var template_file_key = this._getTemplateKey(warnings);
    var template = cdb.templates.getTemplate(this._TEMPLATES[template_file_key]);

    this.$el.html(
      template({
        warnings: warnings
      })
    );

    return this;
  },

  _getTemplateKey: function(warnings) {
    // We have warnings precedence between max layers an max tables per import.
    // For example, one import could reach the limit of layers an tables at the
    // same time.
    if (warnings.user_max_layers && warnings.max_tables_per_import) {
      return (warnings.user_max_layers < warnings.max_tables_per_import) ? 'partial_import' : 'too_many_files'
    } else if (warnings.user_max_layers) {
      return 'partial_import';
    } else if (warnings.max_tables_per_import) {
      return 'too_many_files';
    } else if (warnings.max_rows_per_connection) {
      return 'too_many_rows_connection';
    }
  }
});
