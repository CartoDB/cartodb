const glob = require('glob');
const { resolve } = require('path');

const rootDir = file => resolve(__dirname, '../../../', file);

module.exports = {
  new_dashboard: [
    '@babel/polyfill',
    rootDir('lib/assets/javascripts/new-dashboard/main.js'),
    ...glob.sync(rootDir('assets/stylesheets/new-dashboard/main.scss')),
    rootDir('node_modules/internal-carto.js/themes/scss/entry.scss')
  ],

  header: [
    rootDir('lib/assets/javascripts/new-dashboard/bundles/header/header.js'),
    rootDir('lib/assets/javascripts/new-dashboard/styles/bundles/header.scss')
  ],

  footer: [
    rootDir('lib/assets/javascripts/new-dashboard/bundles/footer/footer.js'),
    rootDir('lib/assets/javascripts/new-dashboard/styles/bundles/footer.scss')
  ]
};
