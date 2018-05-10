const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const randomQuote = require('builder/components/loading/random-quote');
const AvatarSelector = require('dashboard/components/avatar-selector/avatar-selector-view');
const PasswordConfirmationView = require('dashboard/components/password-confirmation/password-confirmation-view');
const template = require('./profile-form.tpl');
const loadingTemplate = require('builder/components/loading/loading.tpl');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'renderModel',
  'userModel',
  'modals',
  'setLoading',
  'onSaved',
  'onError'
];

module.exports = CoreView.extend({
  events: {
    'click .js-save': '_onClickSave',
    'submit form': '_onClickSave'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._renderModel, 'change:isLoading', this.render);
  },

  render: function () {
    this.clearSubViews();

    if (this._renderModel.get('isLoading')) {
      this.$el.html(
        loadingTemplate({
          title: this._renderModel.get('loadingText'),
          descHTML: randomQuote()
        })
      );
    } else {
      this.$el.html(template({
        formAction: `${this._configModel.prefixUrl()}/profile`,
        description: this._userModel.get('description'),
        name: this._userModel.get('name'),
        last_name: this._userModel.get('last_name'),
        website: this._userModel.get('website'),
        twitter_username: this._userModel.get('twitter_username'),
        disqus_shortname: this._userModel.get('disqus_shortname'),
        available_for_hire: this._userModel.get('available_for_hire'),
        location: this._userModel.get('location'),
        isViewer: this._userModel.isViewer(),
        hasOrganization: this._userModel.isInsideOrg(),
        orgDisplayEmail: this._getOrgAdminEmail()
      }));

      this._initViews();
    }

    return this;
  },

  _getOrgAdminEmail: function () {
    if (this._userModel.isInsideOrg()) {
      return this._userModel.organization.display_email;
    } else {
      return null;
    }
  },

  _initViews: function () {
    const avatarSelector = new AvatarSelector({
      el: this.$('.js-avatarSelector'),
      configModel: this._configModel,
      renderModel: new Backbone.Model({
        inputName: this.$('.js-fileAvatar').attr('name'),
        name: this._userModel.get('name') || this._userModel.get('username'),
        avatar_url: this._userModel.get('avatar_url'),
        id: this._userModel.get('id'),
        username: this._userModel.get('username')
      }),
      acceptedExtensions: this._configModel.avatar_valid_extensions
    });
    avatarSelector.render();
    this.addView(avatarSelector);
  },

  _getUserFields: function () {
    return {
      description: this._userModel.get('description') || '',
      avatar_url: this._userModel.get('avatar_url') || '',
      name: this._userModel.get('name') || '',
      last_name: this._userModel.get('last_name') || '',
      website: this._userModel.get('website') || '',
      twitter_username: this._userModel.get('twitter_username') || '',
      disqus_shortname: this._userModel.get('disqus_shortname') || '',
      available_for_hire: this._userModel.get('available_for_hire') || false,
      location: this._userModel.get('location') || ''
    };
  },

  _getDestinationValues: function () {
    return {
      description: this.$('#user_description').val(),
      avatar_url: this.$('#user_avatar_url').val(),
      name: this.$('#user_name').val(),
      last_name: this.$('#user_last_name').val(),
      website: this.$('#user_website').val(),
      twitter_username: this.$('#user_twitter_username').val(),
      disqus_shortname: this.$('#user_disqus_shortname').val(),
      available_for_hire: this.$('#available_for_hire').is(':checked'),
      location: this.$('#user_location').val()
    };
  },

  _onClickSave: function (event) {
    this.killEvent(event);

    const origin = this._getUserFields();
    const destination = this._getDestinationValues();
    const destinationKeys = _.keys(destination);

    const differenceKeys = _.filter(destinationKeys, function (key) {
      return origin[key] !== destination[key];
    });

    const user = _.pick(destination, differenceKeys);

    this._userModel.set({ user: user });

    if (!this._userModel.get('needs_password_confirmation')) {
      this._sendForm();
    }

    this._modals.create(modalModel => {
      return new PasswordConfirmationView({
        modalModel,
        onPasswordTyped: this._sendForm.bind(this)
      });
    });
  },

  _sendForm: function (password) {
    $('html, body').scrollTop(0);

    this._setLoading('Saving changes');

    this._userModel.sync('update', this._userModel, {
      wait: true,
      url: this._configModel.prefixUrl() + '/api/v3/me',
      success: this._onSaved,
      error: this._onError,
      attrs: {
        ...this._userModel.attributes,
        user: { password }
      }
    });
  }
});
