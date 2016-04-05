var cdb = require('cartodb.js-v3');

/**
 * Error details view, to be used together with an error object from an import model.
 *
 */

module.exports = cdb.core.View.extend({
  _TEMPLATES: {
    'partial_import': 'common/views/partial_import_details',
    'too_many_files': 'common/views/too_many_files_details'
  },

  initialize: function () {
    this.warnings = this.options.warnings;
  },

  render: function () {
    var warnings = this.warnings;
    var template;

    // XOR. Only warn user about zip limit if his max_layers limit is larger
    if (warnings.user_max_layers ? !warnings.max_tables_per_import : warnings.max_tables_per_import) {
      template = cdb.templates.getTemplate(
        this._TEMPLATES[warnings.user_max_layers ? 'partial_import' : 'too_many_files']
      );
    } else {
      template = cdb.templates.getTemplate(
        this._TEMPLATES[(warnings.user_max_layers < warnings.max_tables_per_import) ? 'partial_import' : 'too_many_files']
      );
    }

    this.$el.html(
      template({
        warnings: warnings
      })
    );

    return this;
  }
});
