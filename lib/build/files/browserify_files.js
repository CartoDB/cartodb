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
  explore: {
    src: [
      'lib/assets/javascripts/cartodb/explore/entry.js'
    ]
  },
  user_feed: {
    src: [
      'lib/assets/javascripts/cartodb/user_feed/entry.js'
    ]
  },
  account: {
    src: [
      'lib/assets/javascripts/cartodb/account/entry.js'
    ]
  },
  account_static: {
    src: [
      'lib/assets/javascripts/cartodb/account/index.js'
    ]
  },
  profile_static: {
    src: [
      'lib/assets/javascripts/cartodb/profile/index.js'
    ]
  },
  confirmation: {
    src: [
      'lib/assets/javascripts/cartodb/confirmation/entry.js'
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
  dashboard_static: {
    src: [
      'lib/assets/javascripts/cartodb/dashboard/index.js'
    ]
  },
  show_static: {
    src: [
      'lib/assets/javascripts/cartodb/show/index.js'
    ]
  },
  keys: {
    src: [
      'lib/assets/javascripts/cartodb/keys/entry.js'
    ]
  },
  new_public_table: {
    src: [
      'lib/assets/javascripts/cartodb/public_table.js'
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
  data_library: {
    src: [
      'lib/assets/javascripts/cartodb/data_library/entry.js'
    ]
  },
  public_map: {
    src: [
      'lib/assets/javascripts/cartodb/public_map/entry.js'
    ]
  },
  public_map_static: {
    src: [
      'lib/assets/javascripts/cartodb/public_map/index.js'
    ]
  },
  embed_map_static: {
    src: [
      'lib/assets/javascripts/cartodb/embed_map/index.js'
    ]
  },
  mobile_apps: {
    src: [
      'lib/assets/javascripts/cartodb/mobile_apps/entry.js'
    ]
  },
  test_specs_for_browserify_modules: {
    src: [
      'lib/build/source-map-support.js',

      // Dependency for editor specs
      'lib/assets/javascripts/cartodb/editor.js',

      // Add specs for browserify module code here:
      'lib/assets/test/spec/cartodb/account/**/*.spec.js',
      'lib/assets/test/spec/cartodb/common/**/*.spec.js',
      'lib/assets/test/spec/cartodb/dashboard/**/*.spec.js',
      'lib/assets/test/spec/cartodb/components/**/*.spec.js',
      'lib/assets/test/spec/cartodb/editor/**/*.spec.js',
      'lib/assets/test/spec/cartodb/keys/**/*.spec.js',
      'lib/assets/test/spec/cartodb/organization*/**/*.spec.js',
      'lib/assets/test/spec/cartodb/public_dashboard/**/*.spec.js',
      'lib/assets/test/spec/cartodb/data_library/**/*.spec.js',
      'lib/assets/test/spec/cartodb/feed/**/*.spec.js',
      'lib/assets/test/spec/cartodb/explore/**/*.spec.js',
      'lib/assets/test/spec/cartodb/profile/**/*.spec.js',
      'lib/assets/test/spec/cartodb/show/**/*.spec.js',
      'lib/assets/test/spec/cartodb/public_map/**/*.spec.js',
      'lib/assets/test/spec/cartodb/embed_map/**/*.spec.js',
      'lib/assets/test/spec/cartodb/public/**/*.spec.js'
    ],
    dest: '.grunt/browserify_modules_tests.js'
  }
};
