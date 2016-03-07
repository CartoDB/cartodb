// modules that will be exporte from default cartodb bundle, to be used in e.g. cartodb.mod.torque bundle
var sharedModules = [
  'backbone',
  'cdb',
  'cdb.config',
  'cdb.core.util',
  'cdb.log',
  'jquery',
  'leaflet',
  'underscore',
  'torque.js'
];

module.exports = {
  'src-specs': {
    src: [
      'test/fail-tests-if-have-errors-in-src.js',
      'test/spec/api/**/*',
      'test/spec/core/**/*',
      'test/spec/dataviews/**/*',
      'test/spec/util/**/*',
      'test/spec/geo/**/*',
      'test/spec/ui/**/*',
      'test/spec/vis/**/*',
      'test/spec/windshaft/**/*',

      // not actually used anywhere in cartodb.js, only for editor?
      // TODO can be (re)moved?
      '!test/spec/ui/common/tabpane.spec.js'
    ],
    dest: '<%= config.tmp %>/src-specs.js'
  },

  cartodb: {
    src: 'src/cartodb.js',
    dest: '<%= config.dist %>/cartodb.uncompressed.js',
    options: {
      require: sharedModules
    }
  },
  'cartodb-specs': {
    src: [
      'test/fail-tests-if-have-errors-in-src.js',
      'test/spec/cartodb.spec.js'
    ],
    dest: '<%= config.tmp %>/cartodb-specs.js',
    options: {
      require: sharedModules
    }
  }
};
