var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var _ = require('underscore');

/**
 * Change privacy datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy_template');
    this.item = this.options.item; // of model cdb.admin.Visualization
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return this.template({
      itemName: this.item.get('name'),
      privacyOptions: this._privacyOptionsData()
    });
  },
  
  cancel: function() {
    this.clean();
  },

  _privacyOptionsData: function() {
    return [{
      illustrationType: 'positive',
      iconFontType: 'Unlock',
      title: 'Public',
      desc: 'Everyone can view your table and download it'
    },{
      illustrationType: 'alert',
      iconFontType: 'Unlock',
      title: 'With link',
      desc: 'Only people with a share link can view the data'
    },{
      illustrationType: 'alert',
      iconFontType: 'UnlockEllipsis',
      title: 'Password protected',
      desc: 'Set a password and share only with specific people'
    },{
      illustrationType: 'negative',
      iconFontType: 'Lock',
      title: 'Private',
      desc: 'Nobody can access this dataset'
    }];
  }
});
