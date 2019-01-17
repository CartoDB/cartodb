const Polyglot = require('node-polyglot');
const Locale = require('locale/index');

const ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'en';
const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

const Backbone = require('backbone');
const _ = require('underscore');
const $ = require('jquery');
const ConfigModel = require('dashboard/data/config-model');
const UserSettingsView = require('dashboard/components/navbar/user-settings-view');
const UserIndustriesView = require('dashboard/components/navbar/user-industries-view');
const MapCardPreview = require('dashboard/components/mapcard-preview-view');
const AuthenticatedUser = require('dashboard/data/authenticated-user-model');
const UserModel = require('dashboard/data/user-model');
const UserMetaView = require('dashboard/components/user-meta-view/user-meta-view');
const PublicTableWindow = require('dashboard/views/public-dataset/public-table-window');

const ForbiddenAction = require('builder/data/backbone/network-interceptors/interceptors/forbidden-403');
const NetworkResponseInterceptor = require('builder/data/backbone/network-interceptors/interceptor');
NetworkResponseInterceptor.addURLPattern('api/v');
NetworkResponseInterceptor.addErrorInterceptor(ForbiddenAction());
NetworkResponseInterceptor.start();

$(function () {
  const configModel = new ConfigModel(
    _.defaults(
      {
        base_url: window.base_url
      },
      window.config
    )
  );

  if (window.api_key) configModel.set('api_key', window.api_key);

  new UserIndustriesView({ // eslint-disable-line no-new
    el: $('.js-user-industries')
  });

  new UserMetaView({ // eslint-disable-line no-new
    el: $('.js-user-meta'),
    model: new Backbone.Model({
      active: false
    })
  });

  const authenticatedUser = new AuthenticatedUser();
  authenticatedUser.bind('change', function () {
    if (authenticatedUser.get('username')) {
      const user = new UserModel(authenticatedUser.attributes);
      const userSettingsView = new UserSettingsView({
        el: $('.js-user-settings'),
        model: user
      });
      userSettingsView.render();

      $('.js-login').hide();
      $('.js-learn').show();

      if (user.get('username') === window.owner_username) {
        // Show "Edit in CartoDB" button if logged user
        // is the map owner ;)
        $('.js-edit').css('display', 'inline-block');
        $('.js-oneclick').hide();
      }
    }
  });

  $('.MapCard').each(function () {
    const visId = $(this).data('visId');
    if (visId) {
      const username = $(this).data('visOwnerName');
      const mapCardPreview = new MapCardPreview({
        config: configModel,
        el: $(this).find('.js-header'),
        visId: $(this).data('visId'),
        username: username,
        mapsApiResource: configModel.getMapsResourceName(username)
      });
      mapCardPreview.load();
    }
  });

  authenticatedUser.fetch();

  /**
   *  entry point for public table view
   */
  // Add easeinquad animation
  $.extend($.easing, {
    easeInQuad: function (x, t, b, c, d) {
      return c * (t /= d) * t + b;
    }
  });

  // Check if device is a mobile
  var mobileDevice = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Window view
  new PublicTableWindow({ // eslint-disable-line no-new
    configModel,
    el: window,
    table_id: window.table_id,
    table_name: window.table_name,
    user_name: window.user_name,
    owner_username: window.owner_username,
    vizjson: window.vizjson_obj,
    auth_token: window.auth_token,
    https: window.use_https,
    api_key: window.api_key,
    schema: window.schema,
    config: window.config,
    isMobileDevice: mobileDevice,
    belong_organization: window.belong_organization
  });
});
