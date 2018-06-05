const glob = require('glob');
const { resolve } = require('path');

const rootDir = file => resolve(__dirname, '../../', file);
const removeDuplicated = array => Array.from(new Set(array.reverse())).reverse();

module.exports = {
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
    rootDir('assets/stylesheets/common/likes-indicator.scss'),
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

  deep_insights_new: [
    rootDir('assets/stylesheets/deep-insights/entry.scss'),
    rootDir('node_modules/internal-carto.js/themes/scss/entry.scss')
  ],

  builder_embed: [
    'whatwg-fetch',
    resolve(__dirname, '../../', 'lib/assets/javascripts/builder/public_editor.js'),
    rootDir('assets/stylesheets/plugins/tipsy.scss'),
    rootDir('node_modules/cartoassets/src/scss/entry.scss')
  ],
  dataset: resolve(__dirname, '../../', 'lib/assets/javascripts/builder/dataset.js'),
  builder: resolve(__dirname, '../../', 'lib/assets/javascripts/builder/editor.js')
};
