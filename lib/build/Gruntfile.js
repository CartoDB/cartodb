module.exports = function(grunt) {

  var cartodb_files = require('./files');
  var Mustache = require('./mustache');

  var concat = {};

  for(var f in cartodb_files) {
    if(f[0] !== '_') {
      concat[f] = {
        src: cartodb_files[f],
        dest: '../../public/javascripts/' + f + ".js"
      };
    }
  }

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: concat,
    jst: {
      compile: {
        options: {
           processName: function(filename) {
            return filename.replace(/^\.\.\/assets\/javascripts\//, '').replace(/\.jst\.ejs$/, '');
          }
        },
        files: {
          "../../public/javascripts/templates.js": cartodb_files._templates
        }
      },
      mustache: {
        options: {
           processName: function(filename) {
            return filename.replace(/^..\/assets\/javascripts\//, '').replace(/\.jst\.mustache/, '');
          },
          template: function(source) {
            var src = source.replace(/\n/g, '\\n').replace(/'/g,"\\'")
            return { source: "Mustache.compile('"+ src +"')" }
          }
        },
        files: {
          'dist/templates_mustache.js': cartodb_files._templates_mustache,
        }
      }
    },

    compass: {                  // Task
      dist: {                   // Target
        options: {              // Target options
          importPath: '../../app/assets/stylesheets/tmp/common',
          imagesDir: '../../app/assets/images/',
          sassDir: '../../app/assets/stylesheets/tmp',
          cssDir: 'dist/css',
          environment: 'production',
          outputStyle: 'compact',
          force: false,
          time: true
        }
      },
    },

    copy: {
      dist: {
        files: [
          {
            expand: true,
            cwd: '../../app/assets/stylesheets/',
            src: ['**/*.css.scss'],
            dest: '../../app/assets/stylesheets/tmp/',
            rename: function(dest, src) {
              return dest + src.replace(/\.css.scss$/, ".scss");
            }
          }
        ]
      }
    },

    // watch: {
    //   // options: {
    //   //   livereload: true
    //   // },
    //   css: {
    //     files: ['../../app/assets/stylesheets/*.scss'],
    //     tasks: ['compass']
    //   }
    // },

    jasmine: {
      pivotal: {
          src: cartodb_files.all.concat(['user_data.js', 'dist/templates_mustache.js', 'dist/templates.js', 'test_init.js']),
          options: {
            specs:  cartodb_files.specs,
            helpers: ['http://maps.google.com/maps/api/js?sensor=false&v=3.12'].concat(cartodb_files._spec_helpers)
             //'--remote-debugger-port': 9000
          }
      }
    }
  });

  //grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-compass');
  // grunt.loadNpmTasks('grunt-compass-multiple');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  //grunt.registerTask('default', ['uglify']);
  grunt.registerTask('test', ['concat', 'jst', 'jasmine']);
  grunt.registerTask('css', ['copy', 'compass']);
  grunt.registerTask('default', ['concat', 'jst']);
};

