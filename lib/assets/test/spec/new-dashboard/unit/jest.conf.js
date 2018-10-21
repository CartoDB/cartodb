const path = require('path');

const srcPath = 'lib/assets/javascripts/';
const testPath = 'lib/assets/test/spec/new-dashboard';

module.exports = {
  rootDir: path.resolve(__dirname, '../../../../../../'),
  roots: [
    `<rootDir>/${testPath}/unit/specs`
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
    '^backbone/core-view$': `<rootDir>/${srcPath}/vendor/backbone/core-view.js`
  },
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    '.*\\.(vue)$': '<rootDir>/node_modules/vue-jest'
  },
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],
  setupFiles: [`<rootDir>/${testPath}/unit/setup`],
  coverageDirectory: `<rootDir>/${testPath}/coverage`,
  collectCoverageFrom: [
    `${srcPath}/components/**/*.{js,vue}`
  ]
};
