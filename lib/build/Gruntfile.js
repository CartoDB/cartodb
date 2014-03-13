module.exports = function(grunt) {

  var cartodb_files = require('./files');
  var css_files = require('./css_files');
  var Mustache = require('./mustache');

  var concat = {
    js: { files: {} },
    css: { files: {} }
  }

  for(var f in cartodb_files) {
    if(f[0] !== '_') {
      concat.js.files['../../public/javascripts/' + f + ".js"] = cartodb_files[f]
    }
  }

  for(var f in css_files) {
    if(f[0] !== '_') {
      concat.css.files['../../public/stylesheets/' + f + ".css"] = css_files[f];
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
          '../../public/javascripts/templates_mustache.js': cartodb_files._templates_mustache,
        }
      }
    },

    compass: {                  // Task
      dist: {                   // Target
        options: {              // Target options
          importPath: '../../app/assets/stylesheets/tmp/common',
          imagesDir: '../../app/assets/images/',
          sassDir: '../../app/assets/stylesheets/tmp',
          cssDir: '../../public/stylesheets',
          environment: 'production',
          outputStyle: 'compressed',
          noLineComments: true,
          force: false,
          time: true
        }
      },
    },

    copy: {
      dist: {
        files: [

          // App stylesheets
          {
            expand: true,
            cwd: '../../app/assets/stylesheets/',
            src: ['**/*.css.scss'],
            dest: '../../app/assets/stylesheets/tmp/',
            rename: function(dest, src) {
              return dest + src.replace(/\.css.scss$/, ".scss");
            }
          },

          // Jasmine stylesheets
          {
            expand: true,
            cwd: '../../lib/assets/test/lib/jasmine-1.3.1/',
            src: ['**/*.css'],
            dest: '../../app/assets/stylesheets/tmp/specs/',
            rename: function(dest, src) {
              return dest + src.replace(/\.css$/, ".scss");
            }
          },

          // Vendor stylesheets
          {
            expand: true,
            cwd: '../../vendor/assets/stylesheets/',
            src: ['**/*.css'],
            dest: '../../app/assets/stylesheets/tmp/vendor/',
            rename: function(dest, src) {
              return dest + src.replace(/\.css$/, ".scss");
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
          src: cartodb_files.all.concat(['user_data.js', '../../public/javascripts/templates_mustache.js', '../../public/javascripts/templates.js', 'test_init.js']),
          options: {
            specs:  cartodb_files.specs,
            helpers: ['http://maps.google.com/maps/api/js?sensor=false&v=3.12'].concat(cartodb_files._spec_helpers)
             //'--remote-debugger-port': 9000
          }
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  //grunt.registerTask('default', ['uglify']);
  grunt.registerTask('test', ['concat:js', 'jst', 'jasmine']);
  grunt.registerTask('css', ['copy', 'compass', 'concat:css']);
  grunt.registerTask('default', ['concat:js', 'css', 'jst']);
};

