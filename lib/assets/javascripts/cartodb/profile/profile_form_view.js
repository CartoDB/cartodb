var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var randomQuote = require('../common/view_helpers/random_quote');
var AvatarSelector = require('../common/avatar_selector_view');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-save': '_onClickSave',
    'submit form': '_onClickSave'
  },

  initialize: function () {
    _.each(['setLoading', 'onSaved', 'onError'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this.template = cdb.templates.getTemplate('profile/views/profile_form');

    this.setLoading = this.options.setLoading;

    this._initModels();
    this._initBinds();
  },

  _initBinds: function () {
    this._renderModel.on('change:isLoading', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    if (this._renderModel.get('isLoading')) {
      this.$el.html(
        this.getTemplate('common/templates/loading')({
          title: this._renderModel.get('loadingText'),
          quote: randomQuote()
        })
      );
    } else {
      this.$el.html(this.template({
        formAction: cdb.config.prefixUrl() + '/profile',
        description: this._getField('description'),
        name: this._getField('name'),
        last_name: this._getField('last_name'),
        website: this._getField('website'),
        twitter_username: this._getField('twitter_username'),
        disqus_shortname: this._getField('disqus_shortname'),
        available_for_hire: this._getField('available_for_hire'),
        location: this._getField('location'),
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

  _initModels: function () {
    this.config = this.options.config;
    this._userModel = this.options.user;
    this._renderModel = this.options.renderModel;
    this.add_related_model(this._renderModel);
  },

  _initViews: function () {
    var avatarSelector = new AvatarSelector({
      el: this.$('.js-avatarSelector'),
      renderModel: new cdb.core.Model({
        inputName: this.$('.js-fileAvatar').attr('name'),
        name: this._getField('name') || this._getField('username'),
        avatar_url: this._getField('avatar_url'),
        id: this._getField('id'),
        username: this._getField('username')
      }),
      avatarAcceptedExtensions: this.config.avatar_valid_extensions
    });
    avatarSelector.render();
    this.addView(avatarSelector);
  },

  _getField: function (field) {
    return this._userModel.get(field);
  },

  _getUserFields: function () {
    return {
      description: this._getField('description') || '',
      avatar_url: this._getField('avatar_url') || '',
      name: this._getField('name') || '',
      last_name: this._getField('last_name') || '',
      website: this._getField('website') || '',
      twitter_username: this._getField('twitter_username') || '',
      disqus_shortname: this._getField('disqus_shortname') || '',
      available_for_hire: this._getField('available_for_hire') || false,
      location: this._getField('location') || ''
    };
  },

  _getDestinationValues: function () {
    return {
      description: this._description(),
      avatar_url: this._avatar(),
      name: this._name(),
      last_name: this._last_name(),
      website: this._website(),
      twitter_username: this._twitter_username(),
      disqus_shortname: this._disqus_shortname(),
      available_for_hire: this._available_for_hire(),
      location: this._location()
    };
  },

  _onClickSave: function (event) {
    this.killEvent(event);

    var origin = this._getUserFields();
    var destination = this._getDestinationValues();
    var destinationKeys = _.keys(destination);

    var differenceKeys = _.filter(destinationKeys, function (key) {
      return origin[key] !== destination[key];
    });

    var user = _.pick(destination, differenceKeys);

    this.setLoading('Saving changes');

    this._userModel.save({ user: user }, {
      wait: true,
      url: cdb.config.prefixUrl() + '/api/v3/me',
      success: this.options.onSaved,
      error: this.options.onError
    });
  },

  _description: function () {
    return this.$('#user_description').val();
  },

  _avatar: function () {
    return this.$('#user_avatar_url').val();
  },

  _name: function () {
    return this.$('#user_name').val();
  },

  _last_name: function () {
    return this.$('#user_last_name').val();
  },

  _website: function () {
    return this.$('#user_website').val();
  },

  _twitter_username: function () {
    return this.$('#user_twitter_username').val();
  },

  _disqus_shortname: function () {
    return this.$('#user_disqus_shortname').val();
  },

  _available_for_hire: function () {
    return this.$('#available_for_hire').is(':checked');
  },

  _location: function () {
    return this.$('#user_location').val();
  }
});
