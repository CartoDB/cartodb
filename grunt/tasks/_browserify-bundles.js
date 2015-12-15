
var torqueSpecs = [
  'test/spec/vis/vis-torque.spec.js',
  'test/spec/api/create-layer-torque.spec.js',
  'test/spec/geo/gmaps/gmaps-torque-layer-view.spec.js',
  'test/spec/geo/leaflet/leaflet-torque-layer.spec.js',
  'test/spec/geo/ui/mobile-torque.spec.js',
  'test/spec/geo/ui/layer-selector-torque.spec.js'
];

// modules that will be exporte from default cartodb bundle, to be used in e.g. cartodb.mod.torque bundle
var sharedModules = [
  'backbone',
  'cdb',
  'cdb/core/util',
  'cdb/geo/cartodb-logo',
  'jquery',
  'leaflet',
  'underscore'
]

module.exports = {

  'src-specs': {
    src: [
        'test/fail-tests-if-have-errors-in-src.js',
        'test/spec/api/**/*',
        'test/spec/core/**/*',
        'test/spec/geo/**/*',
        'test/spec/ui/**/*',
        'test/spec/vis/**/*',
        'test/spec/windshaft/**/*',

        // not actually used anywhere in cartodb.js, only for editor?
        // TODO can be (re)moved?
        '!test/spec/ui/common/tabpane.spec.js',
      ]
      // Exclude torque specs
      .concat(torqueSpecs.map(function(uri) {
        return '!' + uri
      })),
    dest: '<%= config.tmp %>/src-specs.js',
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
      'test/spec/cartodb.spec.js',
    ],
    dest: '<%= config.tmp %>/cartodb-specs.js',
  },

  'cartodb.mod.torque': {
    src: 'src/cartodb.mod.torque.js',
    dest: '<%= config.dist %>/cartodb.mod.torque.uncompressed.js',
    options: {
      external: sharedModules
    }
  },
  'cartodb.mod.torque-specs': {
    src: ['test/spec/cartodb.mod.torque.spec.js']
      .concat(torqueSpecs),
    dest: '<%= config.tmp %>/cartodb.mod.torque-specs.js',
    options: {
      external: sharedModules
    }
  }
};
