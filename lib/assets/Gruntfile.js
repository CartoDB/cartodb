module.exports = function(grunt) {

  var cartodb_files = require('./files');
  var Handlebars = require('handlebars');
  var Mustache = require('mustache');

  var concat = {};

  for(var f in cartodb_files) {
    if(f[0] !== '_') {
      concat[f] = {
        src: cartodb_files[f],
        dest: 'dist/' + f + ".js"
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
            return filename.replace(/^javascripts\//, '').replace(/\.jst\.ejs$/, '');
          }
        },
        files: {
          "dist/templates.js": cartodb_files._templates
        }
      },
      mustache: {
        options: {
           processName: function(filename) {
            return filename.replace(/^javascripts\//, '').replace(/\.jst\.mustache/, '');
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

  // Load the plugin that provides the "uglify" task.
  //grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jst');

  // Default task(s).
  //grunt.registerTask('default', ['uglify']);
  grunt.registerTask('test', ['concat', 'jst', 'jasmine']);
  grunt.registerTask('default', ['concat', 'jst']);

};

