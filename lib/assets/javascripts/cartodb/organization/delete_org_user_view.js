var cdb = require('cartodb.js-v3');
var BaseDialog = require('../common/views/base_dialog/view');

module.exports = BaseDialog.extend({

  options: {
    authenticityToken: '',
    organizationUser: {}
  },

  className: 'Dialog is-opening',

  initialize: function () {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('organization/views/delete_org_user');
  },

  render_content: function () {
    return this.template({
      username: this.options.organizationUser.get('username'),
      formAction: cdb.config.prefixUrl() + '/organization/users/' + this.options.organizationUser.get('username'),
      authenticityToken: this.options.authenticityToken
    });
  }
});
