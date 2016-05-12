var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var BaseDialog = require('../common/views/base_dialog/view');

module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'submit .js-form': 'close'
  }),

  className: 'Dialog is-opening',

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('common/views/delete_mobile_app');
  },

  render_content: function() {
    return this.template({
      formAction: cdb.config.prefixUrl() + '/your_apps/mobile/' + window.mobile_app_id,
      authenticityToken: this.options.authenticityToken
    });
  }

})

