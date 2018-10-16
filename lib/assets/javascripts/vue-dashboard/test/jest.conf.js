const path = require('path')

const VUE_BASE_DIRECTORY = '/lib/assets/javascripts/vue-dashboard';

module.exports = {
  rootDir: path.resolve(__dirname, '../../../../../'),
  moduleFileExtensions: [
    'js',
    'json',
    'vue'
  ],
  moduleNameMapper: {
    '^@/(.*)$': `<rootDir>${VUE_BASE_DIRECTORY}/$1`
  },
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    '.*\\.(vue)$': '<rootDir>/node_modules/vue-jest'
  },
  testPathIgnorePatterns: [
    `<rootDir>${VUE_BASE_DIRECTORY}/test/e2e`
  ],
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],
  setupFiles: [`<rootDir>${VUE_BASE_DIRECTORY}/test/setup`],
  coverageDirectory: `<rootDir>${VUE_BASE_DIRECTORY}/test/coverage`,
  collectCoverageFrom: [
    `${VUE_BASE_DIRECTORY}/**/*.{js,vue}`,
    `!${VUE_BASE_DIRECTORY}/main.js`,
    `!${VUE_BASE_DIRECTORY}/router/index.js`,
    '!**/node_modules/**'
  ],
  roots: [
    `<rootDir>${VUE_BASE_DIRECTORY}/test/specs`
  ]
};
