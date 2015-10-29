var cdb = require('cartodb.js');

/**
 * Error details view, to be used together with an error object from an import model.
 *
 */

module.exports = cdb.core.View.extend({
  _TEMPLATES: {
    'partial_import': 'common/views/partial_import_details',
    'too_many_files': 'common/views/too_many_files_details',
    default: 'common/views/error_details'
  },

  initialize: function() {
    this.warnings = this.options.warnings;
  },

  render: function() {
    var warnings = this.warnings;

    var template = cdb.templates.getTemplate(this._TEMPLATES['partial_import']);

    if (warnings.max_tables_per_import) {
      template = cdb.templates.getTemplate(this._TEMPLATES['too_many_files']);
    }

    this.$el.html(
      template({
        warnings: warnings
      })
    );

    return this;
  }

});
