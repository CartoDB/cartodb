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
  account: {
    src: [
      'lib/assets/javascripts/cartodb/account/entry.js'
    ]
  },
  editor: {
    src: [
      'lib/assets/javascripts/cartodb/editor.js'
    ]
  },
  dashboard: {
    src: [
      'lib/assets/javascripts/cartodb/dashboard/entry.js'
    ]
  },
  keys: {
    src: [
      'lib/assets/javascripts/cartodb/keys/entry.js'
    ]
  },
  organization: {
    src: [
      'lib/assets/javascripts/cartodb/organization/entry.js'
    ]
  },
  public_dashboard: {
    src: [
      'lib/assets/javascripts/cartodb/public_dashboard/entry.js'
    ]
  },
  public_data_dashboard: {
    src: [
      'lib/assets/javascripts/cartodb/public_data_dashboard/entry.js'
    ]
  },
  public_map: {
    src: [
      'lib/assets/javascripts/cartodb/public_map/entry.js'
    ]
  },
  // public_table: {
  //   src: [
  //     'lib/assets/javascripts/cartodb/public_table/entry.js'
  //   ]
  // },
  confirmation: {
    src: [
      'lib/assets/javascripts/cartodb/confirmation/entry.js'
    ]
  },
  test_specs_for_browserify_modules: {
    src: [
      'lib/build/source-map-support.js',

      // Add specs for browserify module code here:
      'lib/assets/javascripts/cartodb/editor.js',
      'lib/assets/test/spec/cartodb/common/**/*.spec.js',
      'lib/assets/test/spec/cartodb/organization/**/*.spec.js',
      'lib/assets/test/spec/cartodb/dashboard/**/*.spec.js',
      'lib/assets/test/spec/cartodb/keys/**/*.spec.js',
      'lib/assets/test/spec/cartodb/public_dashboard/**/*.spec.js',
      'lib/assets/test/spec/cartodb/account/**/*.spec.js',
      'lib/assets/test/spec/cartodb/editor/**/*.spec.js'
    ],
    dest: '<%= browserify_modules.tests.dest %>'
  }
};
