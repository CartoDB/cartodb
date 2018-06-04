const glob = require('glob');
const { resolve } = require('path');

const rootDir = file => resolve(__dirname, '../../', file);
const cartoAssets = rootDir('node_modules/cartoassets/src/scss/entry.scss');

module.exports = {
  common: [
    ...glob.sync(rootDir('assets/stylesheets/common/**/*.scss')),
    cartoAssets
  ],

  // cartodb: rootDir('vendor/assets/stylesheets/cartodb.css'),

  dashboard: [
    ...glob.sync(rootDir('assets/stylesheets/dashboard/*.scss')),
    rootDir('assets/stylesheets/editor-3/_scroll-view.scss')
  ],

  public_table_new: rootDir('lib/assets/javascripts/dashboard/public-dataset.js'),

  public_dashboard_new: rootDir('lib/assets/javascripts/dashboard/public-dashboard.js'),

  user_feed_new: rootDir('lib/assets/javascripts/dashboard/user-feed.js'),

  api_keys_new: [
    rootDir('lib/assets/javascripts/dashboard/api-keys.js'),
    rootDir('assets/stylesheets/dashboard/api-keys.scss'),
    rootDir('vendor/assets/stylesheets/tipsy.css')
  ],

  data_library_new: rootDir('lib/assets/javascripts/dashboard/data-library.js'),

  mobile_apps_new: rootDir('lib/assets/javascripts/dashboard/mobile-apps.js'),

  account_new: rootDir('lib/assets/javascripts/dashboard/account.js'),

  profile_new: rootDir('lib/assets/javascripts/dashboard/profile.js'),

  sessions_new: rootDir('lib/assets/javascripts/dashboard/sessions.js'),

  confirmation_new: rootDir('lib/assets/javascripts/dashboard/confirmation.js'),

  dashboard_new: rootDir('lib/assets/javascripts/dashboard/dashboard.js'),

  organization_new: rootDir('lib/assets/javascripts/dashboard/organization.js')
};
