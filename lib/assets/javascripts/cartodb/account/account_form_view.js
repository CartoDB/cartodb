var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var randomQuote = require('../common/view_helpers/random_quote');
var GooglePlus = require('../common/google_plus');
var ServiceItem = require('./service_item_view');
var DeleteAccount = require('../common/delete_account_view');

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
    // TODO
    this.iframeSrc = this.options.iframeSrc;

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
        username: this._getField('username'),
        errors: '',
        canChangeEmail: this._getField('can_change_email'),
        email: this._getField('email'),
        isInsideOrg: this.user.isInsideOrg(),
        authUsernamePasswordEnabled: this._getField('auth_username_password_enabled'),
        shouldDisplayOldPassword: this._getField('should_display_old_password'),
        canChangePassword: this._getField('can_change_password'),
        isOrgOwner: this.user.isOrgOwner(),
        planName: this._getField('plan_name'),
        planUrl: this._getField('plan_url'),
        canBeDeleted: this._getField('can_be_deleted'),
        cantBeDeletedReason: this._getField('cant_be_deleted_reason'),
        services: this._getField('services') || []
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
    this.$('.js-deleteAccount').click(function (event) {
      event && event.preventDefault();

      new DeleteAccount({
        authenticityToken: window.authenticity_token,
        clean_on_hide: true,
        user: this.user
      }).appendToBody();
    }.bind(this));

    if (this.iframeSrc) {
      var googlePlus = new GooglePlus({
        model: this.user,
        iframeSrc: this.iframeSrc
      });

      googlePlus.hide();
      this.$('.js-confirmPassword').parent().after(googlePlus.render().el);
    }

    if (this.services && this.services.length > 0) {
      _.each(this.services, function (service) {
        var serviceItem = new ServiceItem({
          model: new cdb.core.Model(_.extend({ state: 'idle' }, service))
        });

        $('.js-datasourcesContent').after(serviceItem.render().el);
      });
    }
  },

  _getField: function (field) {
    return this.user.get(field);
  },

  _onClickSave: function (event) {
    this.killEvent(event);

    var origin = {
      username: this._getField('username'),
      email: this._getField('email'),
      old_password: this._getField('old_password'),
      new_password: this._getField('new_password'),
      confirm_password: this._getField('confirm_password')
    };

    var destiny = {
      username: this._username(),
      email: this._email(),
      old_password: this._oldPassword(),
      new_password: this._newPassword(),
      confirm_password: this._confirmPassword()
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
