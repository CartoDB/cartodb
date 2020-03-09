/**
 * Entry point bundles that are expected to be minimized and distributed on CDNs goes here.
 *
 * Format:
 *   name_of_bundle: {
 *   src: [
 *    'some/path/file.js',
 *    'another/path/sfile.js',
 *     //...
 *   ]
 *
 * The defined files in the "src" array will be written to public/assets/javascripts/X.X.X/name_of_bundle.js, where X.X.X
 * is the current frontend version. Grunt will then take care of minification etc.
 */

module.exports = {
  user_feed: {
    src: [
      'lib/assets/javascripts/cartodb/user_feed/entry.js'
    ]
  },
  editor: {
    src: [
      'lib/assets/javascripts/cartodb/editor.js'
    ]
  },
  public_dashboard: {
    src: [
      'lib/assets/javascripts/cartodb/public_dashboard/entry.js'
    ]
  },
  public_map: {
    src: [
      'lib/assets/javascripts/cartodb/public_map/entry.js'
    ]
  },
  test_specs_for_browserify_modules: {
    src: [
      'lib/build/source-map-support.js',

      // Dependency for editor specs
      'lib/assets/javascripts/cartodb/editor.js',

      // Add specs for browserify module code here:
      'lib/assets/test/spec/cartodb/common/**/*.spec.js',
      'lib/assets/test/spec/cartodb/components/**/*.spec.js',
      'lib/assets/test/spec/cartodb/editor/**/*.spec.js',
      'lib/assets/test/spec/cartodb/public_dashboard/**/*.spec.js',
      'lib/assets/test/spec/cartodb/feed/**/*.spec.js',
      'lib/assets/test/spec/cartodb/show/**/*.spec.js',
      'lib/assets/test/spec/cartodb/public/**/*.spec.js'
    ],
    dest: '.grunt/browserify_modules_tests.js'
  }
};
