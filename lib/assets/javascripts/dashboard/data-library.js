const Backbone = require('backbone');
const Polyglot = require('node-polyglot');
const _ = require('underscore');
const $ = require('jquery');
require('dashboard/data/backbone/sync-options');

const Locale = require('../locale/index');
const AuthenticatedUser = require('dashboard/data/authenticated-user-model');
const UserModel = require('dashboard/data/user-model');
const ConfigModel = require('dashboard/data/config-model');
const UserSettingsView = require('dashboard/components/navbar/user-settings-view');
const UserIndustriesView = require('dashboard/components/navbar/user-industries-view');
const UserInfoView = require('dashboard/components/user-info/user-info-view');
const DataLibraryView = require('dashboard/views/data-library/data-library-view');

const ACTIVE_LOCALE = window.ACTIVE_LOCALE || 'en';
const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

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
