
  /**
   *  CartoDB UI assets generation
   */

  module.exports = function(grunt) {

    var ASSETS_DIR = '../../public/assets/<%= pkg.version %>';


    // Project configuration.
    grunt.initConfig({
      pkg:      grunt.file.readJSON('package.json'),

      assets_dir: ASSETS_DIR,

      // Concat task
      concat:   require('./tasks/concat').task(),

      // JST generation task
      jst:      require('./tasks/jst').task(),

      // Compass files generation
      compass:  require('./tasks/compass').task(),

      // Copy assets (stylesheets, javascripts, images...)
      copy:     require('./tasks/copy').task(),

      // Watch actions
      // watch:    require('./tasks/watch').task(),

      // Clean folders before other tasks
      clean:    require('./tasks/clean').task(),

      // Jasmine tests
      jasmine:  require('./tasks/jasmine.js').task()

    });

    // Load Grunt tasks
    require('load-grunt-tasks')(grunt);

    require('./tasks/manifest').register(grunt, ASSETS_DIR);

    grunt.registerTask('test',    ['concat:js', 'jst', 'jasmine']);
    grunt.registerTask('css',     ['copy', 'compass', 'concat:css']);
    grunt.registerTask('default', ['clean', 'concat:js', 'css', 'jst']);

  };
