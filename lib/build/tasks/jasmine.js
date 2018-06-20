var js_files = require('../files/js_files');

module.exports = {
  cartodbui: {
    src: js_files.all.concat([
      'lib/build/user_data.js',
      '<%= assets_dir %>/javascripts/templates_mustache.js',
      '<%= assets_dir %>/javascripts/templates.js',
      'lib/build/test_init.js']),
    options: {
      browser: 'phantomjs',
      headless: true,
      keepRunner: true, // do not delete the runner (added to gitignore anyway), makes sure the runner is up-to-date
      outfile: '_SpecRunner.html',
      host: 'http://localhost:8088',
      summary: true,
      display: 'none',
      specs: js_files.specs,
      helpers: ['http://maps.googleapis.com/maps/api/js?v=3.30&sensor=false'].concat(js_files._spec_helpers)
    // '--remote-debugger-port': 9000
    }
  }
};
