const _ = require('underscore');
const CoreView = require('backbone/core-view');
const Utils = require('builder/helpers/utils');
const template = require('./invite-users-form.tpl');
const flashTemplate = require('./invite-users-flash-message.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'organization',
  'organizationUsers'
];

/**
 *  Form view for invite users dialog
 *
 */

module.exports = CoreView.extend({

  events: {
    'submit .js-invitesForm': '_onSubmit',
    'keyup .js-welcomeText': '_onTextareaChange',
    'click .js-enableSignInButton': '_signInEnabledMessage'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template({
        welcomeText: this.model.get('welcome_text'),
        signupEnabled: this._organization.get('signup_enabled'),
        viewerEnabled: this._organization.get('viewer_seats') > 0
      })
    );

    this._toggleEmailError(false);
    this._initViews();

    return this;
  },

  _renderFlashMessage: function () {
    this.$('.js-signInMessageContainer').html(flashTemplate());
    this.$('.js-flashSuccess').hide();
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change', this._onChange);
  },

  _initViews: function () {
    const organizationUsersEmail = this._organizationUsers.pluck('email');

    this.$('.js-tagsList').tagit({
      allowSpaces: true,
      placeholderText: this.$('.js-tags').data('title'),
      onBlur: () => this.$('.js-tags').removeClass('is-focus'),
      onFocus: () => this.$('.js-tags').addClass('is-focus'),
      beforeTagAdded: (event, ui) => {
        var value = ui.tagLabel;
        this._removeSubmitError();

        // It is an email
        if (!Utils.isValidEmail(value)) {
          return false;
        }

        // It is already in the organization
        if (_.contains(organizationUsersEmail, value)) {
          this._toggleEmailError(true);
          return false;
        } else {
          this._toggleEmailError(false);
        }
      },
      beforeTagRemoved: () => this._removeSubmitError(),
      afterTagRemoved: () => this._updateUsers(),
      afterTagAdded: () => this._updateUsers(),
      onSubmitTags: (event) => {
        event.preventDefault();
        this._onSubmit();
        return false;
      }
    });

    if (!this._organization.get('signup_enabled')) {
      this._renderFlashMessage();
    }
  },

  _onTextareaChange: function () {
    this.model.set('welcome_text', this.$('.js-welcomeText').val());
  },

  _updateUsers: function () {
    this.model.set('users_emails', this.$('.js-tagsList').tagit('assignedTags'));
  },

  _onSubmit: function (event) {
    event && this.killEvent(event);

    const emails = this.model.get('users_emails');

    if (emails.length > 0) {
      this.model.set('welcome_text', this.$('.js-welcomeText').val());
      this.model.set('viewer', this.$('[name=viewer]').get(0).checked);
      this.trigger('onSubmit', this);
    }
  },

  _signInEnabledMessage: function () {
    this.$('.js-signInMessage').addClass('FlashMessage--success');
    this.$('.js-flashNotice').hide();
    this.$('.js-flashSuccess').show();

    this.model.set('enable_organization_signup', true);
  },

  _toggleEmailError: function (visible) {
    this.$('.js-emailError')[ visible ? 'show' : 'hide' ]();
  },

  showSubmitError: function (msg) {
    const $serverError = this.$('.js-serverError');

    if ($serverError.length === 0) {
      this.$('.js-emailError').after('<p class="Form-rowInfoText Form-rowInfoText--error Form-rowInfoText--multipleLines js-serverError">' + msg + '</p>');
    }
  },

  _removeSubmitError: function () {
    this.$('.js-serverError').remove();
  },

  _onChange: function () {
    const users = this.model.get('users_emails');
    const welcomeText = this.model.get('welcome_text');

    this.$('.js-submit').toggleClass('is-disabled', users.length === 0 || !welcomeText);
  }
});
