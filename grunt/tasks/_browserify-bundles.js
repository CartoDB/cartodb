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
      'test/spec/windshaft-integration/**/*',
      'test/spec/analysis/**/*',
      'test/spec/engine.spec.js',

      // not actually used anywhere in cartodb.js, only for editor?
      // TODO can be (re)moved?
      '!test/spec/ui/common/tabpane.spec.js'
    ],
    dest: '<%= tmp %>/src-specs.js',
    options: {
      require: [ 'camshaft-reference/versions/0.59.4/reference.json:./versions/0.59.4/reference.json' ],
      insertGlobalVars: {
        // We need to set __ENV__ to production to simulate
        // the same behaviour as webpack.definePlugin
        __ENV__: function () { return JSON.stringify('test'); }
      },
      transform: [
        ['babelify', {
          presets: ['env'],
          plugins: ['transform-object-rest-spread']
        }]
      ]
    }
  },

  cartodb: {
    src:  [
      'src/cartodb.js'
    ],
    exclude: [
      'src/api/v4/'
    ],
    dest: '<%= dist %>/internal/cartodb.uncompressed.js',
    options: {
      require: [ 'camshaft-reference/versions/0.59.4/reference.json:./versions/0.59.4/reference.json' ]
    }
  }
};
