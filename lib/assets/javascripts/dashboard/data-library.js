const Backbone = require('backbone');
const _ = require('underscore');
const $ = require('jquery');
require('dashboard/data/backbone/sync-options');
require('locale/i18n');

const AuthenticatedUser = require('dashboard/data/authenticated-user-model');
const UserModel = require('dashboard/data/user-model');
const ConfigModel = require('dashboard/data/config-model');
const UserSettingsView = require('dashboard/components/navbar/user-settings-view');
const UserIndustriesView = require('dashboard/components/navbar/user-industries-view');
const UserInfoView = require('dashboard/components/user-info/user-info-view');
const DataLibraryView = require('dashboard/views/data-library/data-library-view');

<<<<<<< HEAD
=======
const ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'en';
const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

const ForbiddenAction = require('builder/data/backbone/network-interceptors/interceptors/forbidden-403');
const NetworkResponseInterceptor = require('builder/data/backbone/network-interceptors/interceptor');
NetworkResponseInterceptor.addURLPattern('api/v');

>>>>>>> 0ff8f8ae99af867d311edb47e3feb0a98b26f2f3
const configModel = new ConfigModel(
  _.defaults(
    {
      base_url: window.base_url,
      dataset_base_url: window.dataset_base_url
    },
    window.config
  )
);

/**
 * Entry point for data-library index
 */

$(function () {
  let userModel;
  const authenticatedUser = new AuthenticatedUser({
    host: `${configModel.get('common_data_user')}.${configModel.get('account_host')}`
  });

  authenticatedUser.sync = Backbone.withCORS;

  authenticatedUser.on('change', function (model) {
    if (model.get('username')) {
      NetworkResponseInterceptor.addErrorInterceptor(ForbiddenAction(model.get('username')));
      NetworkResponseInterceptor.start();

      userModel = new UserModel(model.attributes, {
        configModel: configModel
      });

      const userSettingsView = new UserSettingsView({
        el: $('.js-user-settings'),
        model: userModel
      });
      userSettingsView.render();
    }
  });

  authenticatedUser.fetch();

  const userIndustriesView = new UserIndustriesView({ // eslint-disable-line no-unused-vars
    el: $('.js-user-industries')
  });

  var userInfoView = new UserInfoView({
    el: $('.js-user-info')
  });
  userInfoView.render();

  const dataLibraryView = new DataLibraryView({ configModel });
  $('.js-data_library').append(dataLibraryView.render().el);
});
