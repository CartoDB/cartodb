
  /**
   *  Jasmine task config
   */

  var js_files = require('../files/js_files');

  exports.task = function() {
    return {
      cartodbui: {
        src: js_files.all.concat([
          'lib/build/user_data.js',
          '<%= assets_dir %>/javascripts/templates_mustache.js',
          '<%= assets_dir %>/javascripts/templates.js', 
          'lib/build/test_init.js']),
        options: {
          summary: true,
          display: 'short',
          specs:  js_files.specs,
          helpers: ['http://maps.google.com/maps/api/js?sensor=false&v=3.12'].concat(js_files._spec_helpers)
           //'--remote-debugger-port': 9000
        }
      },
      cartodbui2: {
        // options.specs are created by the browserify task.
        options: {
          vendor: [
            '<%= assets_dir %>/javascripts/cdb.js',
            '<%= assets_dir %>/javascripts/models.js'
          ],
          summary: true,
          display: 'short',
          specs: './lib/assets/test/cartodb2_tests.js',
          keepRunner: true // do not delete _SpecRunner.html, added in .gitignore so won't be versioned anyway.
        }
      }
    }
  };
