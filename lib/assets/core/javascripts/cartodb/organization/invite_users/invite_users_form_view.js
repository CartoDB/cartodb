var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var Utils = require('cdb.Utils');

/**
 *  Form view for invite users dialog
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'submit .js-invitesForm': '_onSubmit',
    'keyup .js-welcomeText': '_onTextareaChange',
    'click .js-enableSignInButton': '_signInEnabledMessage'
  },

  initialize: function () {
    this.organizationUsers = this.options.organizationUsers;
    this.organization = this.options.organization;
    this.template = cdb.templates.getTemplate('organization/invite_users/invite_users_form_template');
    this._initBinds();
  },

  render: function () {
    this.$el.html(
      this.template({
        welcomeText: this.model.get('welcome_text'),
        signupEnabled: this.organization.get('signup_enabled'),
        viewerEnabled: this.organization.get('viewer_seats') > 0
      })
    );
    this._toggleEmailError(false);
    this._initViews();
    return this;
  },

  _renderFlashMessage: function () {
    var flashTemplate = cdb.templates.getTemplate('organization/invite_users/invite_users_flash_message_template');
    this.$('.js-signInMessageContainer').html(flashTemplate());

    this.$('.js-flashSuccess').hide();
  },

  _initBinds: function () {
    this.model.bind('change', this._onChange, this);
  },

  _initViews: function () {
    var self = this;
    var organizationUsersEmail = this.organizationUsers.pluck('email');

    this.$('.js-tagsList').tagit({
      allowSpaces: true,
      placeholderText: this.$('.js-tags').data('title'),
      onBlur: function () {
        self.$('.js-tags').removeClass('is-focus');
      },
      onFocus: function () {
        self.$('.js-tags').addClass('is-focus');
      },
      beforeTagAdded: function (ev, ui) {
        var value = ui.tagLabel;
        self._removeSubmitError();

        // It is an email
        if (!Utils.isValidEmail(value)) {
          return false;
        }

        // It is already in the organization
        if (_.contains(organizationUsersEmail, value)) {
          self._toggleEmailError(true);
          return false;
        } else {
          self._toggleEmailError(false);
        }
      },
      beforeTagRemoved: function () {
        self._removeSubmitError();
      },
      afterTagRemoved: function (ev, ui) {
        self._updateUsers();
      },
      afterTagAdded: function (ev, ui) {
        self._updateUsers();
      },
      onSubmitTags: function (ev, tagList) {
        ev.preventDefault();
        self._onSubmit();
        return false;
      }
    });

    if (!this.organization.get('signup_enabled')) {
      this._renderFlashMessage();
    }
  },

  _onTextareaChange: function () {
    this.model.set('welcome_text', this.$('.js-welcomeText').val());
  },

  _updateUsers: function () {
    this.model.set('users_emails', this.$('.js-tagsList').tagit('assignedTags'));
  },

  _onSubmit: function (ev) {
    if (ev) {
      this.killEvent(ev);
    }
    var emails = this.model.get('users_emails');
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
    var $serverError = this.$('.js-serverError');
    if ($serverError.length === 0) {
      this.$('.js-emailError').after('<p class="Form-rowInfoText Form-rowInfoText--error Form-rowInfoText--multipleLines js-serverError">' + msg + '</p>');
    }
  },

  _removeSubmitError: function () {
    this.$('.js-serverError').remove();
  },

  _onChange: function () {
    var users = this.model.get('users_emails');
    var welcomeText = this.model.get('welcome_text');
    this.$('.js-submit').toggleClass('is-disabled', users.length === 0 || !welcomeText);
  }

});
