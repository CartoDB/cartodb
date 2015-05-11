var $ = require('jquery');
var cdb = require('cartodb.js');
var BaseDialog = require('./views/base_dialog/view');

/** 
 *  When user wants to delete his own account
 *
 */

module.exports = BaseDialog.extend({

  options: {
    authenticityToken: ''
  },

  className: 'Dialog is-opening',

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('common/views/delete_account');
  },

  render_content: function() {
    return this.template({
      formAction: cdb.config.prefixUrl() + '/account',
      authenticityToken: this.options.authenticityToken
    });
  }

})