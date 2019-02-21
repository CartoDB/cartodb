const glob = require('glob');
const { resolve } = require('path');

const rootDir = file => resolve(__dirname, '../../', file);
const removeDuplicated = array => Array.from(new Set(array));

module.exports = {
  common_new: removeDuplicated([
    rootDir('assets/stylesheets/common/utilities.scss'),
    rootDir('assets/stylesheets/common/icon-font-specials.scss'),
    ...glob.sync(rootDir('assets/stylesheets/common/**/*.scss')),
    rootDir('node_modules/cartoassets/src/scss/entry.scss')
  ]),

  deep_insights_new: [
    rootDir('assets/stylesheets/deep-insights/entry.scss'),
    rootDir('node_modules/internal-carto.js/themes/scss/entry.scss')
  ],

  public_map_new: glob.sync(rootDir('assets/stylesheets/public_map/**/*.scss')),

  dashboard: [
    rootDir('lib/assets/javascripts/dashboard/dashboard.js'),
    ...glob.sync(rootDir('assets/stylesheets/dashboard/*.scss')),
    rootDir('assets/stylesheets/editor-3/_scroll-view.scss'),
    rootDir('node_modules/internal-carto.js/themes/scss/entry.scss')
  ],

  new_dashboard: [
    '@babel/polyfill',
    rootDir('lib/assets/javascripts/new-dashboard/main.js'),
    rootDir('lib/assets/javascripts/new-dashboard/styles/main.scss'),
    rootDir('node_modules/internal-carto.js/themes/scss/entry.scss')
  ],

  header: [
    rootDir('lib/assets/javascripts/new-dashboard/bundles/header/header.js'),
    rootDir('lib/assets/javascripts/new-dashboard/styles/bundles/header.scss')
  ],

  footer: [
    rootDir('lib/assets/javascripts/new-dashboard/bundles/footer/footer.js'),
    rootDir('assets/stylesheets/new-dashboard/bundles/footer.scss')
  ],

  public_table_new: [
    rootDir('lib/assets/javascripts/dashboard/public-dataset.js'),
    rootDir('assets/stylesheets/table/table.scss'),
    rootDir('assets/stylesheets/public/public_map_wrapper_new.scss'),
    rootDir('assets/stylesheets/public/public_table_wrapper_new.scss'),
    rootDir('assets/stylesheets/public/public_map_data.scss'),
    rootDir('assets/stylesheets/public/public_map_body.scss'),
    rootDir('assets/stylesheets/public/public_export.scss'),
    ...glob.sync(rootDir('assets/stylesheets/public_table/**/*.scss')),
    rootDir('assets/stylesheets/public/public_map_fullscreen.scss'),
    rootDir('assets/stylesheets/map/map.scss'),
    rootDir('node_modules/leaflet/dist/leaflet.css')
  ],

  public_dashboard_new: [
    rootDir('lib/assets/javascripts/dashboard/public-dashboard.js'),
    ...glob.sync(rootDir('assets/stylesheets/public_dashboard/**/*.scss')),
    rootDir('assets/stylesheets/public_map/public_map_buttons.scss'),
    rootDir('assets/stylesheets/public_map/public_map_footer.scss')
  ],

  user_feed_new: [
    rootDir('lib/assets/javascripts/dashboard/user-feed.js'),
    ...glob.sync(rootDir('assets/stylesheets/user_feed/**/*.scss'))
  ],

  api_keys_new: [
    rootDir('lib/assets/javascripts/dashboard/api-keys.js'),
    rootDir('assets/stylesheets/dashboard/api-keys.scss'),
    rootDir('vendor/assets/stylesheets/tipsy.css'),
    rootDir('node_modules/internal-carto.js/themes/scss/entry.scss')
  ],

  data_library: [
    rootDir('lib/assets/javascripts/dashboard/data-library.js'),
    ...glob.sync(rootDir('assets/stylesheets/data_library/**/*.scss')),
    rootDir('assets/stylesheets/public_map/public_map_buttons.scss'),
    rootDir('assets/stylesheets/public_map/public_map_footer.scss')
  ],

  mobile_apps: [
    rootDir('lib/assets/javascripts/dashboard/mobile-apps.js'),
    ...glob.sync(rootDir('assets/stylesheets/mobile_apps/*.scss'))
  ],

  account: rootDir('lib/assets/javascripts/dashboard/account.js'),

  profile: rootDir('lib/assets/javascripts/dashboard/profile.js'),

  sessions: [
    rootDir('lib/assets/javascripts/dashboard/sessions.js'),
    rootDir('assets/stylesheets/common/flash-message.scss'),
    rootDir('assets/stylesheets/common/tooltip.scss'),
    rootDir('assets/stylesheets/common/logo.scss'),
    rootDir('node_modules/cartoassets/src/scss/entry.scss'),
    ...glob.sync(rootDir('assets/stylesheets/sessions/*.scss'))
  ],

  confirmation: rootDir('lib/assets/javascripts/dashboard/confirmation.js'),

  lockout: rootDir('lib/assets/javascripts/dashboard/lockout.js'),

  new_lockout: [
    '@babel/polyfill',
    rootDir('lib/assets/javascripts/new-dashboard/bundles/lockout/lockout.js')
  ],

  organization: [
    rootDir('lib/assets/javascripts/dashboard/organization.js'),
    rootDir('assets/stylesheets/plugins/tagit.scss'),
    ...glob.sync(rootDir('assets/stylesheets/organization/*.scss')),
    rootDir('assets/stylesheets/editor-3/_assets.scss'),
    rootDir('assets/stylesheets/editor-3/_modals-layout.scss'),
    rootDir('assets/stylesheets/editor-3/_tab-pane.scss'),
    rootDir('assets/stylesheets/editor-3/_modals-elements.scss'),
    rootDir('assets/stylesheets/editor-3/_scroll-view.scss')
  ],

  common_editor3: removeDuplicated([
    rootDir('assets/stylesheets/common/buttons.scss'),
    rootDir('assets/stylesheets/common/create/create_footer.scss'),
    rootDir('assets/stylesheets/common/create/create_header.scss'),
    rootDir('assets/stylesheets/common/error-details.scss'),
    rootDir('assets/stylesheets/common/default.scss'),
    rootDir('assets/stylesheets/common/dialog.scss'),
    rootDir('assets/stylesheets/common/onboarding.scss'),
    rootDir('assets/stylesheets/common/builder-onboarding.scss'),
    rootDir('assets/stylesheets/common/layer-onboarding.scss'),
    rootDir('assets/stylesheets/common/onboarding-notification.scss'),
    rootDir('assets/stylesheets/common/default-paragraph.scss'),
    rootDir('assets/stylesheets/common/default-description.scss'),
    rootDir('assets/stylesheets/common/default-title.scss'),
    rootDir('assets/stylesheets/common/default-time-diff.scss'),
    rootDir('assets/stylesheets/common/privacy-indicator.scss'),
    rootDir('assets/stylesheets/common/no-results.scss'),
    rootDir('assets/stylesheets/common/filters.scss'),
    rootDir('assets/stylesheets/common/intermediate-info.scss'),
    rootDir('assets/stylesheets/common/nav-button.scss'),
    rootDir('assets/stylesheets/common/spinner.scss'),
    rootDir('assets/stylesheets/common/tabs.scss'),
    rootDir('assets/stylesheets/common/titles.scss'),
    rootDir('assets/stylesheets/common/utilities.scss'),
    ...glob.sync(rootDir('assets/stylesheets/common/background-polling/**/*.scss')),
    rootDir('assets/stylesheets/plugins/tipsy.scss'),
    rootDir('assets/stylesheets/common/pagination.scss'),
    rootDir('assets/stylesheets/common/datepicker.scss'),
    rootDir('assets/stylesheets/common/datasets-list.scss'),
    rootDir('assets/stylesheets/common/notifications-list.scss'),
    ...glob.sync(rootDir('assets/stylesheets/common/create/**/*.scss')),
    rootDir('assets/stylesheets/common/form-content.scss'),
    ...glob.sync(rootDir('assets/stylesheets/common/forms/**/*.scss')),
    rootDir('assets/stylesheets/common/option-card.scss'),
    ...glob.sync(rootDir('assets/stylesheets/common/icons/**/*.scss')),
    rootDir('assets/stylesheets/common/maps-list.scss'),
    rootDir('assets/stylesheets/common/map-card.scss')
  ]),

  editor3: [
    rootDir('node_modules/cartoassets/src/scss/entry.scss'),
    rootDir('node_modules/bootstrap-colorpicker/dist/css/bootstrap-colorpicker.css'),
    rootDir('assets/stylesheets/editor-3/entry.scss')
  ],

  builder_embed: [
    'whatwg-fetch',
    resolve(__dirname, '../../', 'lib/assets/javascripts/builder/public_editor.js'),
    rootDir('assets/stylesheets/plugins/tipsy.scss'),
    rootDir('node_modules/cartoassets/src/scss/entry.scss')
  ],

  password_protected: [
    rootDir('assets/stylesheets/public/password_protected.scss'),
    rootDir('node_modules/cartoassets/src/scss/entry.scss')
  ],

  dataset: resolve(__dirname, '../../', 'lib/assets/javascripts/builder/dataset.js'),

  builder: resolve(__dirname, '../../', 'lib/assets/javascripts/builder/editor.js'),

  oauth: [
    rootDir('assets/stylesheets/oauth/oauth.scss')
  ]
};
