var BaseDialog = require('new_common/views/base_dialog/view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');

/**
 * Delete items dialog
 */
module.exports = BaseDialog.extend({

  initialize: function(args) {
    this.elder('initialize');
    this.collection = args.collection;
    this.router = args.router;
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/delete_items/template');
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    var totalCount = this.collection.where({ selected: true }).length;

    return this.template({
      totalCount:            totalCount,
      pluralizedContentType: pluralizeString(this.router.model.get('content_type') === 'datasets' ? 'dataset' : 'map', totalCount)
    })
  }
});
