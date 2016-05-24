var cdb = require('cartodb.js-v3');
var BaseDialog = require('../common/views/base_dialog/view');

module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'submit .js-form': 'close'
  }),

  className: 'Dialog is-opening',

  initialize: function () {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('common/views/delete_mobile_app');
  },

  render_content: function () {
    var mobileAppId = this.options.mobileApp.id;
    return this.template({
      formAction: cdb.config.prefixUrl() + '/your_apps/mobile/' + mobileAppId,
      authenticityToken: this.options.authenticityToken
    });
  }

});
