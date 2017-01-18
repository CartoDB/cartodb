var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../common/views/base_dialog/view');

module.exports = BaseDialog.extend({

  initialize: function() {
    if (!this.options.okCallback) {
      throw new Error('Callback for OK action is mandatory.');
    }
    this.elder('initialize');
    this._numOfIcons = this.options.numOfIcons || 0;
    this._okCallback = this.options.okCallback;
  },

  render_content: function() {
    return this.getTemplate('organization/icons/delete_icons_modal')({
      numOfIcons: this._numOfIcons
    });
  },

  ok: function() {
    this._okCallback();
    this.close();
  }
});
