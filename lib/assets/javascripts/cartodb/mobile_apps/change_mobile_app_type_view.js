var cdb = require('cartodb.js-v3');
var BaseDialog = require('../common/views/base_dialog/view');

module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'click .js-ok': '_changeAppType'
  }),

  className: 'Dialog is-opening',

  initialize: function () {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('common/views/change_mobile_app_type');
  },

  render_content: function () {
    return this.template();
  },

  _changeAppType: function () {
    this.options.appTypeSelected.prop('checked', true);
    this.close();
  }

});
