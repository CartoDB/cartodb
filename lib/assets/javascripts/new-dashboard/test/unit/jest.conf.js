const path = require('path');

const projectPathFromRoot = 'lib/assets/javascripts/new-dashboard';

module.exports = {
  rootDir: path.resolve(__dirname, '../../../../../../'),
  moduleFileExtensions: [
    'js',
    'json',
    'vue'
  ],
  moduleNameMapper: {
    '^new-dashboard/(.*)$': `<rootDir>/${projectPathFromRoot}/src/$1`
  },
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    '.*\\.(vue)$': '<rootDir>/node_modules/vue-jest'
  },
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],
  setupFiles: [`<rootDir>/${projectPathFromRoot}/test/unit/setup`],
  coverageDirectory: `<rootDir>/${projectPathFromRoot}/test/unit/coverage`,
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js',
    '!src/router/index.js',
    '!**/node_modules/**'
  ],
  roots: [
    `<rootDir>/${projectPathFromRoot}/test/unit/specs`
  ]
}
