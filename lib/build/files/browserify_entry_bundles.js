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
  new_dashboard: {
    src: [
      'lib/assets/javascripts/cartodb/new_dashboard/entry.js'
    ]
  },
  new_keys: {
    src: [
      'lib/assets/javascripts/cartodb/new_keys/entry.js'
    ]
  },
  account: {
    src: [
      'lib/assets/javascripts/cartodb/account/entry.js'
    ]
  },
  new_organization: {
    src: [
      'lib/assets/javascripts/cartodb/new_organization/entry.js'
    ]
  },
  new_public_dashboard: {
    src: [
      'lib/assets/javascripts/cartodb/new_public_dashboard/entry.js'
    ]
  },
  editor: {
    src: [
      'lib/assets/javascripts/cartodb/editor.js'
    ]
  }
};
