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

var dependencies = Object.keys(require(__dirname + '/../../../package.json').dependencies);
var commonDependencies = {
  "cartodb-deep-insights.js": true,
  "cartodb.js": true
};
var editor3Bundles = {
  vendor: dependencies.filter(function(dependency) {
    return !commonDependencies.hasOwnProperty(dependency)
  }),
  common: Object.keys(commonDependencies)
};

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
      'lib/assets/test/spec/cartodb/explore/**/*.spec.js'
    ],
    dest: '.grunt/browserify_modules_tests.js'
  },

  vendor_editor3: {
    src: editor3Bundles.vendor,
    dest: '<%= assets_dir %>/javascripts/vendor_editor3.js',
    options: {
      require: editor3Bundles.vendor,
      plugin: [
        ['browserify-resolutions', editor3Bundles.vendor]
      ]
    }
  },

  common_editor3: {
    src: editor3Bundles.common.map(require.resolve),
    dest: '<%= assets_dir %>/javascripts/common_editor3.js',
    options: {
      external: editor3Bundles.vendor,
      require: editor3Bundles.common.map(function(vendor) {
        return [require.resolve(vendor), { expose: vendor }];
      }),
      plugin: [
        ['browserify-resolutions', editor3Bundles.vendor.concat(editor3Bundles.common)]
      ]
    }
  },

  editor3: {
    src: [
      'lib/assets/javascripts/cartodb3/editor.js'
    ],
    dest: '<%= assets_dir %>/javascripts/editor3.js',
    options: {
      external: editor3Bundles.vendor.concat(editor3Bundles.common)
    }
  },

  public_editor3: {
    src: [
      'lib/assets/javascripts/cartodb3/public_editor.js'
    ],
    dest: '<%= assets_dir %>/javascripts/public_editor3.js',
    options: {
      external: editor3Bundles.vendor.concat(editor3Bundles.common),
      plugin: [
        ['browserify-resolutions', editor3Bundles.vendor.concat(editor3Bundles.common)]
      ]
    }
  },

  'cartodb3-specs': {
    src: [
      'lib/build/source-map-support.js',

      // Add specs for browserify module code here:
      'lib/assets/test/spec/cartodb3/**/*.spec.js'
    ],
    dest: '.grunt/cartodb3-specs.js'
  }
};
