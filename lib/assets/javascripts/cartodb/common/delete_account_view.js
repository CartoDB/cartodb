var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var BaseDialog = require('./views/base_dialog/view');

/**
 *  When user wants to delete his own account
 *
 */

module.exports = BaseDialog.extend({

  options: {
    authenticityToken: ''
  },

  events: BaseDialog.extendEvents({
    'submit .js-form': 'close'
  }),

  className: 'Dialog is-opening',

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('common/views/delete_account');
    this._userModel = this.options.user;
  },

  render_content: function() {
    return this.template({
      formAction: cdb.config.prefixUrl() + '/account',
      authenticityToken: this.options.authenticityToken,
      passwordNeeded: !!this._userModel.get('needs_password_confirmation')
    });
  }

})
