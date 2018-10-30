const path = require('path');

const srcPath = 'lib/assets/javascripts/';
const testPath = 'lib/assets/test/spec/new-dashboard';

module.exports = {
  rootDir: path.resolve(__dirname, '../../../../../../'),
  roots: [
    `<rootDir>/${testPath}/unit/specs`
  ],
  moduleDirectories: [
    'node_modules',
    'vendor/assets/javascripts/',
    'lib/assets/javascripts/vendor'
  ],
  moduleFileExtensions: [
    'js',
    'json',
    'vue'
  ],
  moduleNameMapper: {
    '^new-dashboard/(.*)$': `<rootDir>/${srcPath}/new-dashboard/$1`,
    '^dashboard/(.*)$': `<rootDir>/${srcPath}/dashboard/$1`,
    '^builder/(.*)$': `<rootDir>/${srcPath}/builder/$1`,
    '^backbone/core-view$': `<rootDir>/${srcPath}/vendor/backbone/core-view.js`,
    '^mousewheel$': `<rootDir>/node_modules/internal-carto.js/vendor/mousewheel`,
    '^mwheelIntent$': `<rootDir>/node_modules/internal-carto.js/vendor/mwheelIntent`,
    '^html-css-sanitizer$': `<rootDir>/node_modules/internal-carto.js/vendor/html-css-sanitizer-bundle`,
    '^tipsy$': `<rootDir>/vendor/assets/javascripts/jquery.tipsy.js`,
    '^tagit$': `<rootDir>/vendor/assets/javascripts/tag-it.js`,
    // '^markdown$': `<rootDir>/vendor/assets/javascripts/markdown.js`,
    // '^dragster$': `<rootDir>/vendor/assets/javascripts/dragster.js`,
    // '^dropzone$': `<rootDir>/vendor/assets/javascripts/dropzone.js`,
    '^jquery-ui$': `<rootDir>/lib/assets/javascripts/vendor/jquery-ui.js`,
    '^backbone-forms$': `<rootDir>/node_modules/backbone-forms/distribution/backbone-forms.js`,
    '^cdb$': `<rootDir>/node_modules/internal-carto.js/src/cdb`,
    '^cdb.log$': `<rootDir>/node_modules/internal-carto.js/src/cdb.log`,
    '^cdb.core.Profiler$': `<rootDir>/node_modules/internal-carto.js/src/core/profiler`,
    '^cdb.core.util$': `<rootDir>/node_modules/internal-carto.js/src/core/util`,
    '^cdb.templates$': `<rootDir>/node_modules/internal-carto.js/src/cdb.templates`,
    '^cdb.config$': `<rootDir>/node_modules/internal-carto.js/src/cdb.config`
  },
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.tpl$': `<rootDir>/${testPath}/unit/utils/tplLoader.js`,
    '.*\\.(vue)$': '<rootDir>/node_modules/vue-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(internal-carto.js)/)'
  ],
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],
  setupFiles: [`<rootDir>/${testPath}/unit/setup`],
  coverageDirectory: `<rootDir>/${testPath}/coverage`,
  collectCoverageFrom: [
    `${srcPath}/components/**/*.{js,vue}`
  ]
};
