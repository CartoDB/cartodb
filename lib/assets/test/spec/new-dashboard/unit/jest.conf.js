const path = require('path');

const projectPathFromRoot = 'lib/assets/javascripts/new-dashboard';
const testPathFromRoot = 'lib/assets/test/spec/new-dashboard';

module.exports = {
  rootDir: path.resolve(__dirname, '../../../../../../'),
  moduleFileExtensions: [
    'js',
    'json',
    'vue'
  ],
  moduleNameMapper: {
    '^new-dashboard/(.*)$': `<rootDir>/${projectPathFromRoot}/$1`
  },
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    '.*\\.(vue)$': '<rootDir>/node_modules/vue-jest'
  },
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],
  setupFiles: [`<rootDir>/${testPathFromRoot}/unit/setup`],
  coverageDirectory: `<rootDir>/${testPathFromRoot}/unit/coverage`,
  collectCoverageFrom: [
    `${projectPathFromRoot}/components/**/*.{js,vue}`
  ],
  roots: [
    `<rootDir>/${testPathFromRoot}/unit/specs`
  ]
};
