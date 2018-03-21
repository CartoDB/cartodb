const CoreView = require('backbone/core-view');
const randomQuote = require('builder/components/loading/random-quote');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const InviteUsersFormView = require('./invite-users-form-view');
const OrganizationInviteModel = require('dashboard/data/organization-invite-model');
const template = require('./invite-users-dialog.tpl');

const REQUIRED_OPTS = [
  'organization',
  'organizationUsers'
];

/**
 *  Invite users dialog
 *
 *  - Send invites via email.
 *  - Shouldn't send emails to already enabled users.
 *
 */

module.exports = CoreView.extend({

  className: 'Dialog is-opening InviteUsers',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.model = new OrganizationInviteModel({}, {
      organizationId: this._organization.id,
      enable_organization_signup: false
    });
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this.$('.content').addClass('Dialog-content--expanded');

    // TODO: Enable subviews after TabPane has been migrated
    // this._initViews();

    return this;
  },

  render_content: function () {
    return this.template();
  },

  _initViews: function () {
    // Panes
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-content')
    });

    // Create form
    this._form = new InviteUsersFormView({
      model: this.model,
      organization: this._organization,
      organizationUsers: this._organizationUsers,
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

  _sendInvites: function () {
    this._panes.active('loading');

    this.model.save(null, {
      success: () => this.close(),
      error: (model, error) => {
        try {
          const message = JSON.parse(error.responseText).errors.users_emails[0];

          this._form.showSubmitError(message);
          this._panes.active('form');
        } catch (e) {
          this._panes.active('error');
        }
      }
    });
  }
});
