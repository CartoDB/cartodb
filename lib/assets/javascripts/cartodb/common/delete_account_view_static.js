var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var BaseDialog = require('./views/base_dialog/view');

/**
 *  When user wants to delete his own account
 *
 */

module.exports = BaseDialog.extend({
  events: BaseDialog.extendEvents({
    'click .js-ok': '_onClickDelete',
    'submit .js-form': 'close'
  }),

  className: 'Dialog is-opening',

  initialize: function () {
    if (!this.options['onError']) throw new Error('onError is required');

    this.elder('initialize');

    this.template = cdb.templates.getTemplate('common/views/delete_account_static');
    this._userModel = this.options.user;
  },

  render_content: function () {
    return this.template({
      formAction: cdb.config.prefixUrl() + '/api/v3/me',
      passwordNeeded: !!this._userModel.get('needs_password_confirmation')
    });
  },

  _onClickDelete: function (event) {
    this.killEvent(event);

    var deletionPasswordConfirmation = this.$('#deletion_password_confirmation').val();

    $.ajax({
      url: this.$('.js-form').attr('action'),
      type: 'POST',
      data: {
        _method: 'delete',
        deletion_password_confirmation: deletionPasswordConfirmation
      }
    })
      .done(this._onSuccess.bind(this))
      .fail(this._onError.bind(this));
  },

  _onError: function (jqXHR, textStatus, errorThrown) {
    this.options.onError(null, jqXHR);

    this.close();
  },

  _onSuccess: function (data, textStatus, jqXHR) {
    window.location.href = data.logout_url;

    this.close();
  }
});
