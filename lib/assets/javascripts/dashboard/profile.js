const _ = require('underscore');
require('dashboard/data/backbone/sync-options');

const ProfileMainView = require('dashboard/views/profile/profile-main-view');
const OrganizationModel = require('dashboard/data/organization-model');
const ConfigModel = require('dashboard/data/config-model');
const UserModel = require('dashboard/data/user-model');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const AssetsVersionHelper = require('dashboard/helpers/assets-version');

const Locale = require('locale/index');
const Polyglot = require('node-polyglot');
const PACKAGE = require('../../../../package.json');
const ASSETS_VERSION = AssetsVersionHelper.getAssetsVersion(PACKAGE.version);
const ACTIVE_LOCALE = 'en';

const polyglot = new Polyglot({
  locale: ACTIVE_LOCALE,
  phrases: Locale[ACTIVE_LOCALE]
});

const modals = new ModalsServiceModel();

window._t = polyglot.t.bind(polyglot);
window.StaticConfig = window.StaticConfig || {};
window.CartoConfig = window.CartoConfig || {};

const ForbiddenAction = require('builder/data/backbone/network-interceptors/interceptors/forbidden-403');
const NetworkResponseInterceptor = require('builder/data/backbone/network-interceptors/interceptor');
NetworkResponseInterceptor.addURLPattern('api/v3/me');
NetworkResponseInterceptor.addErrorInterceptor(ForbiddenAction());
NetworkResponseInterceptor.start();

/**
 * Entry point for the new keys, bootstraps all dependency models and application.
 */

function dataLoaded (data) {
  const {user_data, organization_notifications} = data;

  const configModel = new ConfigModel(
    _.extend(
      { url_prefix: user_data.base_url,
        base_url: user_data.base_url },
      data.config
    )
  );

  const userModelOptions = { };

  if (user_data.organization) {
    userModelOptions.organization = new OrganizationModel(user_data.organization, { configModel });
  }

  const currentUser = new UserModel(
    _.extend(user_data, {
      can_change_email: data.can_change_email,
      logged_with_google: false,
      google_enabled: false,
      plan_url: data.plan_url
    }),
    userModelOptions
  );

  document.title = 'Your profile | CARTO';

  new ProfileMainView({ // eslint-disable-line
    el: document.body,
    userModel: currentUser,
    configModel,
    modals,
    organizationNotifications: organization_notifications,
    assetsVersion: ASSETS_VERSION
  });
}

if (window.CartoConfig.data) {
  dataLoaded(window.CartoConfig.data);
} else {
  const client = new CartoNode.AuthenticatedClient();

  client.getConfig(function (err, response, data) {
    if (err) {
      console.error(err);
      return err;
    } else {
      dataLoaded(data);
    }
  });
}
