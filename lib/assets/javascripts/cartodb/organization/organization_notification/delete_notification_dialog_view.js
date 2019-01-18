var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../common/views/base_dialog/view');
var randomQuote = require('../../common/view_helpers/random_quote');
var ViewFactory = require('../../common/view_factory');

module.exports = BaseDialog.extend({

  options: {
    authenticityToken: '',
    organizationUser: {}
  },

  events: BaseDialog.extendEvents({
    'click .js-ok': '_ok',
    'click .js-cancel': '_cancel'
  }),

  className: 'Dialog is-opening',

  initialize: function () {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('organization/organization_notification/delete_notification_dialog');
  },

  render_content: function () {
    return this.template({
      formAction: cdb.config.prefixUrl() + '/organization/notifications/' + this.options.notificationId,
      authenticityToken: this.options.authenticityToken
    });
  },

  ok: function () {
    var loadingView = ViewFactory.createDialogByTemplate('common/templates/loading', {
      title: 'Removing…',
      quote: randomQuote()
    });
    loadingView.appendToBody();

    this.submit();
    this.close();
  },

  submit: function () {
    this.$('form').submit();
  }
});
