const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const DashboardHeaderView = require('dashboard/components/dashboard-header-view');
const HeaderViewModel = require('dashboard/views/mobile-apps/header-view-model');
const LocalStorage = require('dashboard/helpers/local-storage');
const IconSelector = require('dashboard/components/icon-selector/icon-selector-view');
const DeleteMobileApp = require('dashboard/views/mobile-apps/delete-mobile-app/delete-mobile-app-view');
const AppPlatformsLegends = require('dashboard/components/app-platforms-legends');
const UserModel = require('dashboard/data/user-model');
const ConfigModel = require('dashboard/data/config-model');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
require('dashboard/data/backbone/sync-options');

const ForbiddenAction = require('builder/data/backbone/network-interceptors/interceptors/forbidden-403');
const NetworkResponseInterceptor = require('builder/data/backbone/network-interceptors/interceptor');
NetworkResponseInterceptor.addURLPattern('api/v');
NetworkResponseInterceptor.addErrorInterceptor(ForbiddenAction());
NetworkResponseInterceptor.start();

const configModel = new ConfigModel(
  _.defaults({ base_url: window.user_data.base_url }, window.config)
);

if (window.trackJs) {
  window.trackJs.configure({
    userId: window.user_data.username
  });
}

/**
 * Entry point for the new keys, bootstraps all dependency models and application.
 */
$(function () {
  const userModel = new UserModel(window.user_data, { configModel });
  const mobileApp = window.mobile_app_data;

  const modals = new ModalsServiceModel();

  new DashboardHeaderView({
    el: $('#header'), // pre-rendered in DOM by Rails app
    model: userModel,
    configModel,
    viewModel: new HeaderViewModel(),
    localStorage: new LocalStorage()
  }).render();

  // Avatar
  const iconSelectorNode = $('.js-iconSelector');

  if (iconSelectorNode.length > 0) {
    const iconSelector = new IconSelector({
      el: iconSelectorNode,
      configModel,
      renderModel: new Backbone.Model({
        id: userModel.get('id'),
        name: mobileApp.name,
        inputName: $('.js-fileIcon').attr('name'),
        icon_url: mobileApp.icon_url
      }),
      iconAcceptedExtensions: window.icon_valid_extensions
    });

    iconSelector.render();
  }

  // Mobile app deletion
  const deleteButton = $('.js-deleteMobileApp');

  if (deleteButton.length > 0) {
    deleteButton.click(function (ev) {
      ev.preventDefault();

      modals.create(function (model) {
        return new DeleteMobileApp({
          modalModel: model,
          configModel,
          authenticityToken: window.authenticity_token,
          needsPasswordConfirmation: userModel.needsPasswordConfirmation(),
          mobileApp: mobileApp
        });
      });
    });
  }

  if ($('.js-appPlatformsLegend').length > 0) {
    new AppPlatformsLegends({
      el: $('.js-MobileAppForm'),
      appPlatforms: mobileApp['mobile_platforms']
    }).render();
  }
});
