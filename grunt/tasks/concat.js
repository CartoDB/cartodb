
/**
 *  Concat grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function(grunt, config) {

    // Get src and vendor js files
    require('../../src/cartodb');

    cdb.files.splice(0, 0, 'cartodb.js');

    var files = cdb.files;
    var vendor_files = [];
    var cdb_files = [];

    for(var i = 0; i < files.length; ++i) {
      var f = files[i];
      if(f.indexOf('vendor') === -1) {
        cdb_files.push('./src/' + f);
      } else {
        vendor_files.push('./vendor/' + f.split('/')[2]);
      }
    }


    return {

      nojquery: {
        options: {
          process: function(src, filepath) {
            // DAMM!
            // It is possible to use neither underscore nor
            // grunt templating, an ILLEGAL token error appears
            // - Solution, replacing text, directly, rude.

            return src
              .replace(/<%= version %>/g, grunt.config.get('bump.version'))
              .replace(/<%= sha %>/g, grunt.config.get('gitinfo').local.branch.current.SHA)
              .replace(/<%= load_jquery %>/g, true)
          }
        },
        files: {
          // Library without jQuery library
          '<%= config.dist %>/_cartodb_nojquery.js':
            ['grunt/templates/wrapper_header.js']
            .concat(vendor_files)
            .concat([
              '!./vendor/jquery.min.js',
              'grunt/templates/wrapper_middle.js'
            ])
            .concat(cdb_files)
            .concat(['grunt/templates/wrapper_footer.js'])
        }
      },

      noleaflet: {
        options: {
          process: function(src, filepath) {
            // DAMM!
            // It is possible to use neither underscore nor
            // grunt templating, an ILLEGAL token error appears
            // - Solution, replacing text, directly, rude.

            return src
              .replace(/<%= version %>/g, grunt.config.get('bump.version'))
              .replace(/<%= sha %>/g, grunt.config.get('gitinfo').local.branch.current.SHA)
              .replace(/<%= load_jquery %>/g, true)
          }
        },
        files: {
          // Library without Leaflet library
          '<%= config.dist %>/_cartodb_noleaflet.js':

            ['grunt/templates/wrapper_header.js']
            .concat(vendor_files)
            .concat([
              '!./vendor/leaflet.js',
              'grunt/templates/wrapper_middle.js'
            ])
            .concat(cdb_files)
            .concat(['grunt/templates/wrapper_footer.js'])
        }
      },

      themes: {
        options: {},
        files: {
          // CartoDB.js CSSs (themes?)
          '<%= config.dist %>/themes/css/cartodb.css': [
            '.tmp/scss/**/*.css'
          ]
        }
      }
    }
  }
}
