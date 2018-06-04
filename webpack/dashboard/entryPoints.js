const glob = require('glob');
const { resolve } = require('path');

const rootDir = file => resolve(__dirname, '../../', file);

module.exports = {
  common: [
    ...glob.sync(rootDir('assets/stylesheets/common/**/*.scss')),
    rootDir('node_modules/cartoassets/src/scss/entry.scss')
  ],

  deep_insights: [
    rootDir('assets/stylesheets/deep-insights/entry.scss'),
    rootDir('node_modules/internal-carto.js/themes/scss/entry.scss')
  ],

  dashboard: [
    rootDir('lib/assets/javascripts/dashboard/dashboard.js'),

    ...glob.sync(rootDir('assets/stylesheets/dashboard/*.scss')),
    rootDir('assets/stylesheets/editor-3/_scroll-view.scss')
  ],

  public_table_new: rootDir('lib/assets/javascripts/dashboard/public-dataset.js'),

  public_dashboard: [
    rootDir('lib/assets/javascripts/dashboard/public-dashboard.js'),
    ...glob.sync(rootDir('assets/stylesheets/public_dashboard/**/*.scss')),
    rootDir('assets/stylesheets/public_map/public_map_buttons.scss'),
    rootDir('assets/stylesheets/public_map/public_map_footer.scss')
  ],

  user_feed: [
    rootDir('lib/assets/javascripts/dashboard/user-feed.js'),
    ...glob.sync(rootDir('assets/stylesheets/user_feed/**/*.scss'))
  ],

  api_keys_new: [
    rootDir('lib/assets/javascripts/dashboard/api-keys.js'),
    rootDir('assets/stylesheets/dashboard/api-keys.scss'),
    rootDir('vendor/assets/stylesheets/tipsy.css')
  ],

  data_library_new: rootDir('lib/assets/javascripts/dashboard/data-library.js'),

  mobile_apps_new: rootDir('lib/assets/javascripts/dashboard/mobile-apps.js'),

  account: rootDir('lib/assets/javascripts/dashboard/account.js'),

  profile: rootDir('lib/assets/javascripts/dashboard/profile.js'),

  sessions_new: rootDir('lib/assets/javascripts/dashboard/sessions.js'),

  confirmation_new: rootDir('lib/assets/javascripts/dashboard/confirmation.js'),

  organization_new: rootDir('lib/assets/javascripts/dashboard/organization.js')
};
