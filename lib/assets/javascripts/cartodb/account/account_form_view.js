var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var randomQuote = require('../common/view_helpers/random_quote');
var GooglePlus = require('../common/google_plus');
var ServiceItem = require('./service_item_view');
var DeleteAccountView = require('../common/delete_account_view_static');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-save': '_onClickSave',
    'submit form': '_onClickSave'
  },

  initialize: function () {
    _.each(['setLoading', 'onSuccess', 'onError'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this.template = cdb.templates.getTemplate('account/views/account_form');

    this.setLoading = this.options.setLoading;

    this._initModels();
    this._initBinds();
  },

  _initModels: function () {
    this._errors = this.options.errors || {};
    this._userModel = this.options.user;
    this._renderModel = this.options.renderModel;
    this.add_related_model(this._renderModel);
  },

  _initBinds: function () {
    this._renderModel.bind('change:isLoading', this.render, this);
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
        formAction: cdb.config.prefixUrl() + '/account',
        accountHost: cdb.config.get('account_host'),
        username: this._getField('username'),
        errors: this._errors,
        canChangeEmail: this._getField('can_change_email'),
        email: this._getField('email'),
        isInsideOrg: this._userModel.isInsideOrg(),
        isLoggedWithGoogle: this._getField('logged_with_google'),
        isAuthUsernamePasswordEnabled: this._userModel.isAuthUsernamePasswordEnabled(),
        shouldDisplayOldPassword: this._getField('should_display_old_password'),
        canChangePassword: this._getField('can_change_password'),
        isOrgOwner: this._userModel.isOrgOwner(),
        planName: this._getField('plan_name'),
        planUrl: this._getField('plan_url'),
        cantBeDeletedReason: this._getField('cant_be_deleted_reason'),
        services: this._getField('services') || []
      }));

      this._initViews();
    }

    return this;
  },

  _initViews: function () {
    var iframeSrc = this._getField('iframe_src');
    var services = this._getField('services');

    this.$('.js-deleteAccount').click(function (event) {
      event && event.preventDefault();

      new DeleteAccountView({
        clean_on_hide: true,
        user: this._userModel,
        onError: this.options.onError
      }).appendToBody();
    }.bind(this));

    if (iframeSrc) {
      var googlePlus = new GooglePlus({
        model: this._userModel,
        iframeSrc: iframeSrc
      });

      googlePlus.hide();
      this.$('.js-confirmPassword').parent().after(googlePlus.render().el);
      this.addView(googlePlus);
    }

    if (services && services.length > 0) {
      _.each(services, function (service) {
        var serviceItem = new ServiceItem({
          model: new cdb.core.Model(_.extend({ state: 'idle' }, service))
        });

        this.$('.js-datasourcesContent').after(serviceItem.render().el);
        this.addView(serviceItem);
      }, this);
    }
  },

  _getField: function (field) {
    return this._userModel.get(field);
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
      url: cdb.config.prefixUrl() + '/api/v3/me', // FIXME use carto-node
      success: this.options.onSuccess,
      error: this.options.onError
    });
  },

  _getUserFields: function () {
    return {
      username: this._getField('username'),
      email: this._getField('email')
    };
  },

  _getDestinationValues: function () {
    return {
      username: this._username(),
      email: this._email(),
      old_password: this._oldPassword(),
      new_password: this._newPassword(),
      confirm_password: this._confirmPassword()
    };
  },

  _username: function () {
    return this.$('#user_username').val();
  },

  _email: function () {
    return this.$('#user_email').val();
  },

  _oldPassword: function () {
    return this.$('#user_old_password').val();
  },

  _newPassword: function () {
    return this.$('#user_new_password').val();
  },

  _confirmPassword: function () {
    return this.$('#confirm_password').val();
  }
});
