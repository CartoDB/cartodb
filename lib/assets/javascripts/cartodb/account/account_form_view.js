var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var randomQuote = require('../common/view_helpers/random_quote');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-save': '_onClickSave',
    'submit form': '_onClickSave'
  },

  initialize: function () {
    _.each(['setLoading', 'onSaved', 'onError'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this.template = cdb.templates.getTemplate('account/views/account_form');

    this.setLoading = this.options.setLoading;

    this._initModels();
    this._initBinds();
  },

  _initBinds: function () {
    this.renderModel.on('change:isLoading', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    if (this.renderModel.get('isLoading')) {
      this.$el.html(
        this.getTemplate('common/templates/loading')({
          title: this.renderModel.get('loadingText'),
          quote: randomQuote()
        })
      );
    } else {
      this.$el.html(this.template({
        formAction: cdb.config.prefixUrl() + '/account',
        username: '',
        errors: '',
        canChangeEmail: '',
        email: '',
        isInsideOrg: '',
        authUsernamePasswordEnabled: '',
        shouldDisplayOldPassword: true,
        canChangePassword: true,
        isOrgOwner: '',
        planName: '',
        planUrl: '',
        canBeDeleted: true,
        services: []
      }));

      this._initViews();
    }

    return this;
  },

  _initModels: function () {
    this.user = this.options.user;
    this.renderModel = this.options.renderModel;
  },

  _initViews: function () {
    // TODO: subviews
  },

  _getField: function (field) {
    return this.user.get(field);
  },

  _onClickSave: function (event) {
    this.killEvent(event);

    var origin = {
    };

    var destiny = {
    };

    var difference = _.difference(destiny, origin);

    if (difference) {
      this.setLoading('Saving changes');

      this.user.save(difference, {
        wait: true,
        success: this.options.onSaved,
        error: this.options.onError
      });
    }
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
