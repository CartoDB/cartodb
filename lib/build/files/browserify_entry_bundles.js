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
  account: {
    src: [
      'lib/assets/javascripts/cartodb/account/entry.js'
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
  public_map: {
    src: [
      'lib/assets/javascripts/cartodb/public_map/entry.js'
    ]
  },
  editor: {
    src: [
      'lib/assets/javascripts/cartodb/editor.js'
    ]
  }
};
