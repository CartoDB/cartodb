var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');

/**
 *  Connect dataset dialog
 */

var View = BaseDialog.extend({

  className: 'Dialog ConnectDialog',

  initialize: function() {
    this.elder('initialize');
    // this.selectedItems = this.options.selectedItems;
    // this.router = this.options.router;
    // this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_common/views/connect_dataset/dialog_template');
  },

  render_content: function() {
    return this.template();
  }

});

module.exports = View;
