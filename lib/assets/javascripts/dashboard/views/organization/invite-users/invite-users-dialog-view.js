const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const loadingView = require('builder/components/loading/render-loading');
const OrganizationInviteModel = require('dashboard/data/organization-invite-model');
const TabPane = require('dashboard/components/tabpane/tabpane');
const errorTemplate = require('dashboard/views/data-library/content/error-template.tpl');
const InviteUsersFormView = require('./invite-users-form-view');
const ViewFactory = require('builder/components/view-factory');
const template = require('./invite-users-dialog.tpl');

require('jquery-ui');
require('tagit');

const REQUIRED_OPTS = [
  'modalModel',
  'organization',
  'organizationUsers',
  'configModel'
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
      configModel: options.configModel,
      organizationId: this._organization.id,
      enable_organization_signup: false
    });
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this.$('.content').addClass('Dialog-content--expanded');

    this._initViews();

    return this;
  },

  _initViews: function () {
    // Panes
    this._panes = new TabPane({
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
    this._panes.addTab('loading', ViewFactory.createByHTML(loadingView({
      title: 'Sending invites...'
    })).render());

    // Create error
    this._panes.addTab('error', ViewFactory.createByHTML(errorTemplate({
      msg: 'Sorry, something went wrong.'
    })).render());

    this._panes.active('form');
  },

  _sendInvites: function () {
    this._panes.active('loading');

    this.model.save(null, {
      success: () => this._modalModel.destroy(),
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
