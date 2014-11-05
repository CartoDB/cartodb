
/**
 *  Concat grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function(grunt, config) {

    return {

      standard: {
        options: {
          process: function(src, filepath) {
            // DAMM!
            // It is possible to use neither underscore nor
            // grunt templating, an ILLEGAL token error appears
            // - Solution, replacing text, directly, rude.

            return src
              .replace(/<%= version %>/g, config.pkg.version)
              .replace(/<%= sha %>/g, grunt.config.get('gitinfo').local.branch.current.SHA)
              .replace(/<%= load_jquery %>/g, true)
          }
        },
        files: {
          // Standard library
          '<%= config.dist %>/cartodb.uncompressed.js': [
            'grunt/templates/wrapper_header.js',
            'vendor/*.js',
            'grunt/templates/wrapper_middle.js',
            'src/**/*.js',
            'grunt/templates/wrapper_footer.js'
          ]
        }
      },

      core: {
        options: {
          banner: grunt.file.read('./grunt/templates/version_header.js') + "" + grunt.file.read('./grunt/templates/core_header.js') + "",
          footer: grunt.file.read('./grunt/templates/core_footer.js')
        },
        files: {
          // Core library
          '<%= config.dist %>/cartodb.core.uncompressed.js': [
            'vendor/underscore-min.js',
            'grunt/templates/underscore_no_conflict.js',
            'vendor/mustache.js',
            'vendor/reqwest.min.js',
            'src/cartodb.js',
            'src/api/core_lib.js',
            'src/core/profiler.js',
            'src/api/sql.js',
            'src/geo/layer_definition.js',
            'src/api/tiles.js'
          ]
        }
      },

      nojquery: {
        options: {
          process: function(src, filepath) {
            // DAMM!
            // It is possible to use neither underscore nor
            // grunt templating, an ILLEGAL token error appears
            // - Solution, replacing text, directly, rude.

            return src
              .replace(/<%= version %>/g, config.pkg.version)
              .replace(/<%= sha %>/g, grunt.config.get('gitinfo').local.branch.current.SHA)
              .replace(/<%= load_jquery %>/g, true)
          }
        },
        files: {
          // Library without jQuery library
          '<%= config.dist %>/_cartodb_nojquery.js': [
            'grunt/templates/wrapper_header.js',
            'vendor/*.js',
            '!vendor/jquery.min.js',
            'grunt/templates/wrapper_middle.js',
            'src/**/*.js',
            'grunt/templates/wrapper_footer.js'
          ]
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
              .replace(/<%= version %>/g, config.pkg.version)
              .replace(/<%= sha %>/g, grunt.config.get('gitinfo').local.branch.current.SHA)
              .replace(/<%= load_jquery %>/g, true)
          }
        },
        files: {
          // Library without Leaflet library
          '<%= config.dist %>/_cartodb_noleaflet.js': [
            'grunt/templates/wrapper_header.js',
            'vendor/*.js',
            '!vendor/leaflet.js',
            'grunt/templates/wrapper_middle.js',
            'src/**/*.js',
            'grunt/templates/wrapper_footer.js'
          ]
        }
      },

      torque: {
        options: {
          banner: grunt.file.read('./grunt/templates/version_header.js'),
          footer: grunt.file.read('./grunt/templates/torque_footer.js')
        },
        files: {
          // Torque library
          '<%= config.dist %>/cartodb.mod.torque.uncompressed.js': [
            'vendor/mod/carto.js',
            'vendor/mod/torque.uncompressed.js',
            'src/geo/gmaps/torque.js',
            'src/geo/leaflet/torque.js',
            'src/geo/ui/time_slider.js',
            'vendor/mod/jquery-ui/jquery.ui.core.js',
            'vendor/mod/jquery-ui/jquery.ui.widget.js',
            'vendor/mod/jquery-ui/jquery.ui.mouse.js',
            'vendor/mod/jquery-ui/jquery.ui.slider.js'
          ]
        }  
      }

      // Full uncompressed?
      // CartoDB.js css (themes?)

    }
  }
}