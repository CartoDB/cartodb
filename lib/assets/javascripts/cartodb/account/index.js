var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var HeaderView = require('../common/views/account_header_view_static');
var SupportView = require('../common/support_view_static');
var HeaderViewModel = require('./header_view_model');
var LocalStorage = require('../common/local_storage');
var DeleteAccount = require('../common/delete_account_view');
var UpgradeMessage = require('../common/upgrade_message_view');
var AvatarSelector = require('../common/avatar_selector_view');
var GooglePlus = require('../common/google_plus');
var ServiceItem = require('./service_item_view');
var UserNotificationView = require('../common/user_notification/user_notification_view');
var UserNotificationModel = require('../common/user_notification/user_notification_model');
var FooterView = require('../common/footer_view_static');
var VendorScriptsView = require('../common/vendor_scripts_view');

window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

/**
 * Entry point for the new keys, bootstraps all dependency models and application.
 */
$(function () {
  cdb.init(function () {
    function getAssetsVersion () {
      var query = window.location.search.substring(1);
      var vars = query.split('&');

      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');

        if (pair[0] === 'v') {
          return pair[1];
        }
      }

      return window.StaticConfig.assetVersion || window.CartoConfig.data.user_frontend_version || cdb.config.get('assets_url').split('/assets/')[1];
    }

    function dataLoaded () {
      var data = window.CartoConfig.data;

      var user_data = data.user_data;
      var config = data.config;
      var dashboard_notifications = data.dashboard_notifications;

      cdb.templates.namespace = 'cartodb/';
      cdb.config.set('url_prefix', user_data.base_url);
      cdb.config.set(config); // import config

      $(document.body).bind('click', function () {
        cdb.god.trigger('closeDialogs');
      });

      var currentUser = new cdb.admin.User(
        _.extend(user_data, {
          logged_with_google: false,
          google_enabled: false
        })
      );
      document.title = 'Your profile | CARTO';

      var headerView = new HeaderView({
        model: currentUser,
        viewModel: new HeaderViewModel(),
        router: this.router,
        localStorage: new LocalStorage()
      });
      this.$('#app').prepend(headerView.render().el);

      var supportView = new SupportView({
        user: currentUser
      });
      this.$('#app').append(supportView.render().el);

      var upgradeMessage = new UpgradeMessage({
        model: currentUser
      });
      this.$('.Header').after(upgradeMessage.render().el);

      var footerView = new FooterView();
      this.$('#app').append(footerView.render().el);

      var vendorScriptsView = new VendorScriptsView({
        config: config,
        assetsVersion: getAssetsVersion(),
        user: currentUser
      });
      this.$('#app').append(vendorScriptsView.render().el);

      // Avatar
      if (this.$('.js-avatarSelector').length > 0) {
        var avatarSelector = new AvatarSelector({
          el: this.$('.js-avatarSelector'),
          renderModel: new cdb.core.Model({
            inputName: this.$('.js-fileAvatar').attr('name'),
            name: currentUser.get('name') || currentUser.get('username'),
            avatar_url: currentUser.get('avatar_url'),
            id: currentUser.get('id')
          }),
          // TODO: avatar_valid_extensions
          avatarAcceptedExtensions: window.avatar_valid_extensions
        });
        avatarSelector.render();
      }

      // User deletion
      // TODO: authenticity_token
      if (this.$('.js-deleteAccount').length > 0 && window.authenticity_token) {
        this.$('.js-deleteAccount').click(function (ev) {
          if (ev) {
            ev.preventDefault();
          }
          new DeleteAccount({
            // TODO: authenticity_token
            authenticityToken: window.authenticity_token,
            clean_on_hide: true,
            user: currentUser
          }).appendToBody();
        });
      }

      // Google + behaviour!
      // If iframe is not present, we can't do anything
      // TODO: iframe_src
      if (window.iframe_src) {
        var googlePlus = new GooglePlus({
          model: currentUser,
          // TODO: iframe_src
          iframeSrc: window.iframe_src
        });

        googlePlus.hide();
        this.$('.js-confirmPassword').parent().after(googlePlus.render().el);
      }

      // Services items
      // TODO: services_list
      if (window.services_list && window.services_list.length > 0) {
        _.each(window.services_list, function (d, i) {
          var serviceItem = new ServiceItem({
            model: new cdb.core.Model(_.extend({ state: 'idle' }, d))
          });
          $('.js-datasourcesContent').after(serviceItem.render().el);
        });
      }

      // TODO: services_list
      if (!cdb.config.get('cartodb_com_hosted')) {
        if (currentUser.get('actions').builder_enabled &&
            currentUser.get('show_builder_activated_message') &&
            _.isEmpty(dashboard_notifications)) {
          var userNotificationModel = new UserNotificationModel(dashboard_notifications, {
            key: 'dashboard',
            configModel: cdb.config
          });

          var dashboardNotification = new UserNotificationView({
            notification: userNotificationModel
          });

          window.dashboardNotification = dashboardNotification;
        }
      }
    }

    if (window.CartoConfig.data) {
      dataLoaded();
    } else {
      var client = new Carto.AuthenticatedClient();

      client.getConfig(function (err, response, data) {
        if (err) {
          console.error(err);

          return err;
        } else {
          window.CartoConfig.data = data;

          dataLoaded();
        }
      });
    }
  });
});
