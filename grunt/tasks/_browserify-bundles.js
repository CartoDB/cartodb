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
    dest: '<%= config.dist %>/cartodb.uncompressed.js'
  },
  'cartodb-specs': {
    src: [
      'test/fail-tests-if-have-errors-in-src.js',
      'test/spec/cartodb.spec.js'
    ],
    dest: '<%= config.tmp %>/cartodb-specs.js'
  }
};
