
var torqueSpecs = [
  'test/spec/vis/vis-torque.spec.js',
  'test/spec/api/create-layer-torque.spec.js',
  'test/spec/geo/gmaps/gmaps-torque-layer-view.spec.js',
  'test/spec/geo/leaflet/leaflet-torque-layer.spec.js',
  'test/spec/geo/ui/mobile-torque.spec.js',
  'test/spec/geo/ui/time-slider.spec.js',
  'test/spec/geo/ui/layer-selector-torque.spec.js'
];

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

  'torque': {
    src: 'src/torque.js',
    dest: '<%= config.dist %>/cartodb.mod.torque.uncompressed.js',
    options: {
      external: ['jquery'], // will be required from cartodb bundle
    }
  },
  'torque-specs': {
    src: ['test/spec/torque.spec.js']
      .concat(torqueSpecs),
    dest: '<%= config.tmp %>/torque-specs.js',
  },

  cartodb: {
    src: 'src/cartodb.js',
    dest: '<%= config.dist %>/cartodb.uncompressed.js',
    options: {
      require: ['jquery'], // expose jquery for other bundles (e.g. torque)
    }
  },
  'cartodb-specs': {
    src: [
      'test/fail-tests-if-have-errors-in-src.js',
      'test/spec/cartodb.spec.js',
    ],
    dest: '<%= config.tmp %>/cartodb-specs.js',
  },

  odyssey: {
    src: 'src/odyssey.js',
    dest: '<%= config.dist %>/cartodb.mod.odyssey.uncompressed.js',
  },
  'odyssey-specs': {
    src: [
      'test/fail-tests-if-have-errors-in-src.js',
      'test/spec/odyssey.spec.js',
    ],
    dest: '<%= config.tmp %>/odyssey-specs.js',
  }
};
