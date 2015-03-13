var $ = require('jquery');
var cdb = require('cartodb.js');
var BaseDialog = require('../new_common/views/base_dialog/view');

/** 
 *  When user wants to delete his own account
 *
 */

module.exports = BaseDialog.extend({

  options: {
    authenticityToken: '',
    organizationUser: {}
  },

  className: 'Dialog is-opening',

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_organization/views/delete_org_user');
  },

  render_content: function() {
    return this.template({
      username: this.options.organizationUser.get('username'),
      formAction: cdb.config.prefixUrl() + '/organization/users/' + this.options.organizationUser.get('username'),
      authenticityToken: this.options.authenticityToken
    });
  }

})