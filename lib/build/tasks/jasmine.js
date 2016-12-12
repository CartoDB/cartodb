var js_files = require('../files/js_files');

module.exports = {
  cartodbui: {
    src: js_files.all.concat([
      'lib/build/user_data.js',
      '<%= assets_dir %>/javascripts/templates_mustache.js',
      '<%= assets_dir %>/javascripts/templates.js',
      'lib/build/test_init.js']),
    options: {
      keepRunner: true, // do not delete the runner (added to gitignore anyway), makes sure the runner is up-to-date
      outfile: '_SpecRunner.html',
      summary: true,
      display: 'full',
      specs: js_files.specs,
      helpers: ['http://maps.googleapis.com/maps/api/js?sensor=false&v=3.12'].concat(js_files._spec_helpers)
    // '--remote-debugger-port': 9000
    }
  },

  cartodb3: {
    options: {
      keepRunner: true, // do not delete the runner (added to gitignore anyway), makes sure the runner is up-to-date
      outfile: '_SpecRunner-cartodb3.html',
      summary: true,
      display: 'short',
      helpers: js_files._spec_helpers3,
      specs: [
        '.grunt/cartodb3-specs.js'
      ],
      vendor: ['node_modules/jasmine-ajax/lib/mock-ajax.js']
    }
  }
};
