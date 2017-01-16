var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../common/views/base_dialog/view');

//var ViewFactory = require('../../view_factory');
//var randomQuote = require('../../view_helpers/random_quote');

module.exports = BaseDialog.extend({

  initialize: function() {
    if (!this.options.okCallback) {
      throw new Error('Callback for OK action is mandatory.');
    }
    this.elder('initialize');
    this._numOfIcons = this.options.numOfIcons || 0;
    this._okCallback = this.options.okCallback;

    this._initViews();
    this._initBinds();
  },

  render_content: function() {
    return this.getTemplate('organization/icons/delete_icons_modal')({
      numOfIcons: this._numOfIcons
    });
  },

  _initViews: function() {
  },

  _initBinds: function() {
  },

  ok: function() {
    this._okCallback();
    this.close();
  }
});
