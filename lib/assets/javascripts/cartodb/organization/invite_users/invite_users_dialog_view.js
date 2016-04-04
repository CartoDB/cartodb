var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../common/views/base_dialog/view');
var randomQuote = require('../../common/view_helpers/random_quote');
var ViewFactory = require('../../common/view_factory');
var InviteUsersFormView = require('./invite_users_form_view');
var _ = require('underscore-cdb-v3');

/**
 *  Invite users dialog
 *
 *  - Send invites via email.
 *  - Shouldn't send emails to already enabled users.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog is-opening InviteUsers',

  initialize: function() {
    this.elder('initialize');
    this.organization = this.options.organization;
    this.organizationUsers = this.options.organizationUsers;
    this.model = new cdb.admin.Organization.Invites(
      {},
      {
        organizationId: this.organization.id,
        enableOrganizationSignIn: false
      }
    );
    this.template = cdb.templates.getTemplate('organization/invite_users/invite_users_dialog_template');
  },

  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  render_content: function() {
    return this.template();
  },

  _initViews: function() {
    // Panes
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-content')
    });

    // Create form
    this._form = new InviteUsersFormView({
      model: this.model,
      organization: this.organization,
      organizationUsers: this.organizationUsers,
      el: this.$('.js-form')
    });

    this._form.bind('onSubmit', this._sendInvites, this);
    this._panes.addTab('form', this._form.render());

    // Create loading
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Sending invites...',
        quote: randomQuote()
      }).render()
    );

    // Create error
    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Sorry, something went wrong.'
      }).render()
    );

    this._panes.active('form');
  },

  _sendInvites: function() {
    var self = this;
    this._panes.active('loading');
    this.model.save(null, {
      success: function() {
        self.close();
      },
      error: function(mdl, err) {
        try {
          var msg = JSON.parse(err.responseText).errors.users_emails[0];
          self._form.showSubmitError(msg);
          self._panes.active('form');
        } catch(e) {
          self._panes.active('error');
        }
      }
    });
  }

});
