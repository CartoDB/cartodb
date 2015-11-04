
var torqueSpecs = [
  'test/spec/src-browserify/vis/vis-torque.spec.js',
  'test/spec/src-browserify/api/create-layer-torque.spec.js',
  'test/spec/src-browserify/geo/gmaps/gmaps-torque-layer-view.spec.js',
  'test/spec/src-browserify/geo/leaflet/leaflet-torque-layer.spec.js',
  'test/spec/src-browserify/geo/ui/mobile-torque.spec.js',
  'test/spec/src-browserify/geo/ui/time-slider.spec.js',
];

module.exports = {

  'src-browserify-specs': {
    src: [
        'test/lib/fail-tests-if-have-errors-in-src.js',
        'test/spec/src-browserify/api/**/*',
        'test/spec/src-browserify/core/**/*',
        'test/spec/src-browserify/geo/**/*',
        'test/spec/src-browserify/ui/**/*',
        'test/spec/src-browserify/vis/**/*',

        // not actually used anywhere in cartodb.js, only for editor?
        // TODO can be (re)moved?
        '!test/spec/src-browserify/ui/common/tabpane.spec.js',
      ]
      // Exclude torque specs
      .concat(torqueSpecs.map(function(uri) {
        return '!' + uri
      })),
    dest: '<%= config.tmp %>/src-browserify-specs.js',
  },

  'torque': {
    src: 'src-browserify/torque.js',
    dest: '<%= config.dist %>/cartodb.mod.torque.uncompressed.js',
  },
  'torque-specs': {
    src: ['test/spec/src-browserify/torque.spec.js']
      .concat(torqueSpecs),
    dest: '<%= config.tmp %>/torque-specs.js',
  },

  cartodb: {
    src: 'src-browserify/cartodb.js',
    dest: '<%= config.dist %>/cartodb.uncompressed.js',
  },
  'cartodb-specs': {
    src: [
      'test/lib/fail-tests-if-have-errors-in-src.js',
      'test/spec/src-browserify/cartodb.spec.js',
    ],
    dest: '<%= config.tmp %>/cartodb-specs.js',
  },

  odyssey: {
    src: 'src-browserify/odyssey.js',
    dest: '<%= config.dist %>/cartodb.mod.odyssey.uncompressed.js',
  },
  'odyssey-specs': {
    src: [
      'test/lib/fail-tests-if-have-errors-in-src.js',
      'test/spec/src-browserify/odyssey.spec.js',
    ],
    dest: '<%= config.tmp %>/odyssey-specs.js',
  }
};
