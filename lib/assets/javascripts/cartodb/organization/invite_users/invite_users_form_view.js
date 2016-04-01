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

  initialize: function() {
    this.organizationUsers = this.options.organizationUsers;
    this.organization = this.options.organization;
    this.template = cdb.templates.getTemplate('organization/invite_users/invite_users_form_template');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        welcomeText: this.model.get('welcome_text'),
        auth_username_password_enabled: this.organization.get('auth_username_password_enabled')
      })
    );
    this._toggleEmailError(false);
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this._onChange, this);
  },

  _initViews: function() {
    var self = this;
    var organizationUsersEmail = this.organizationUsers.pluck('email');

    this.$(".js-tagsList").tagit({
      allowSpaces: true,
      placeholderText: this.$(".js-tags").data('title'),
      onBlur: function() {
        self.$('.js-tags').removeClass('is-focus')
      },
      onFocus: function() {
        self.$('.js-tags').addClass('is-focus')
      },
      beforeTagAdded: function(ev, ui) {
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
      beforeTagRemoved: function() {
        self._removeSubmitError();
      },
      afterTagRemoved: function(ev, ui) {
        self._updateUsers();
      },
      afterTagAdded: function(ev, ui) {
        self._updateUsers();
      },
      onSubmitTags: function(ev, tagList) {
        ev.preventDefault();
        self._onSubmit();
        return false;
      }
    });
  },

  _onTextareaChange: function() {
    this.model.set('welcome_text', this.$('.js-welcomeText').val());
  },

  _updateUsers: function() {
    this.model.set('users_emails', this.$('.js-tagsList').tagit("assignedTags"));
  },

  _onSubmit: function(ev) {
    if (ev) {
      this.killEvent(ev);
    }
    var emails = this.model.get('users_emails');
    if (emails.length > 0) {
      this.model.set('welcome_text', this.$('.js-welcomeText').val());
      this.trigger('onSubmit', this);
    }
  },

  _signInEnabledMessage: function() {
    var signInMessage = this.$('.js-signInMessage');

    signInMessage.addClass("FlashMessage--success").html("<div class='u-inner is-flex'><p class='FlashMessage-info max-width'>You have enabled the sign in page successfully!</p></div>");
    this.model.set("enable_organization_sign_in", true);
  },

  _toggleEmailError: function(visible) {
    this.$('.js-emailError')[ visible ? 'show' : 'hide' ]();
  },

  showSubmitError: function(msg) {
    var $serverError = this.$('.js-serverError');
    if ($serverError.length === 0) {
      this.$('.js-emailError').after('<p class="Form-rowInfoText Form-rowInfoText--error Form-rowInfoText--multipleLines js-serverError">' + msg + '</p>');
    }
  },

  _removeSubmitError: function() {
    this.$('.js-serverError').remove();
  },

  _onChange: function() {
    var users = this.model.get('users_emails');
    var welcomeText = this.model.get('welcome_text');
    this.$('.js-submit').toggleClass('is-disabled', users.length === 0 || !welcomeText);
  }

});
