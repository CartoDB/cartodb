var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');

/**
 *  Form view for invite users dialog
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-submit': '_onSubmit'
  },

  initialize: function() {
    this.organization = this.options.organization;
    this.organizationUsers = this.options.organizationUsers;
    this.template = cdb.templates.getTemplate('organization/invite_users/invite_users_form_template');
    this._initBinds();
  },

  render: function() {
    this.$el.html(this.template());
    this._toggleEmailError(false);
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:users_emails', this._onUsersChange, this);
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

  _updateUsers: function() {
    this.model.set('users_emails', this.$('.js-tagsList').tagit("assignedTags"));
  },

  _onSubmit: function(ev) {
    if (ev) {
      this.killEvent(ev);
    }
    var emails = this.model.get('users_emails');
    if (emails.length > 0) {
      this.model.set('welcome_text', this.$('.js-welcomeText').text());
      this.trigger('onSubmit', this);
    }
  },

  _toggleEmailError: function(visible) {
    this.$('.js-textError')[ visible ? 'show' : 'hide' ]();
  },

  _onUsersChange: function() {
    var users = this.model.get('users_emails');
    this.$('.js-submit').toggleClass('is-disabled', users.length === 0);
  }

});
