var js_files = require('../files/js_files');

const DEFAULT_CONFIG = {
  browser: 'phantomjs',
  headless: true,
  timeout: 20000,
  keepRunner: true,
  // grunt:test (CI) always generates a server on port 8088
  host: 'http://localhost:8088',
  summary: true,
  display: 'none',
  helpers: js_files._spec_helpers3,
  reportSlowerThan: 2000,
  vendor: [
    'node_modules/jasmine-ajax/lib/mock-ajax.js',
    'node_modules/underscore/underscore-min.js'
  ]
};

const getJasmineConfig = (config) => (Object.assign({}, DEFAULT_CONFIG, config));

module.exports = {
  cartodbui: {
    src: js_files.all.concat([
      'lib/build/user_data.js',
      '<%= editor_assets_dir %>/javascripts/templates_mustache.js',
      '<%= editor_assets_dir %>/javascripts/templates.js',
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
      helpers: ['http://maps.googleapis.com/maps/api/js?v=3.32&sensor=false'].concat(js_files._spec_helpers)
      // '--remote-debugger-port': 9000
    }
  },

  dashboard: {
    options: getJasmineConfig({
      outfile: '_SpecRunner_dashboard.html',
      specs: [
        '.grunt/dashboard_specs/vendor.affected-specs.js',
        '.grunt/dashboard_specs/main.affected-specs.js'
      ]
    })
  },

  builder: {
    options: getJasmineConfig({
      outfile: '_SpecRunner_builder.html',
      specs: [
        '.grunt/builder_specs/vendor.affected-specs.js',
        '.grunt/builder_specs/main.affected-specs.js'
      ]
    })
  }
};
