
  /**
   *  CartoDB UI assets generation
   */

  module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
      pkg:      grunt.file.readJSON('package.json'),

      // Concat task
      concat:   require('./tasks/concat').init(),

      // JST generation task
      jst:      require('./tasks/jst').init,

      // Compass files generation
      compass:  require('./tasks/compass').init,
      
      // Copy assets (stylesheets, javascripts, images...)
      copy:     require('./tasks/copy').init,

      // Watch actions
      // watch:    require('./tasks/watch').init,
      
      // Clean folders before other tasks
      clean:    require('./tasks/clean').init,

      // Jasmine tests
      jasmine:  require('./tasks/jasmine.js').init
    });

    // Load Grunt tasks
    require('load-grunt-tasks')(grunt);

    // Register tasks
    grunt.registerTask('test',    ['concat:js', 'jst', 'jasmine']);
    grunt.registerTask('css',     ['copy', 'compass', 'concat:css']);
    grunt.registerTask('default', ['clean', 'concat:js', 'css', 'jst']);

  };