
  /**
   *  CartoDB UI assets generation
   */

  module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
      pkg:      grunt.file.readJSON('package.json'),

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

    // Register tasks
    grunt.registerTask('test',    ['concat:js', 'jst', 'jasmine']);
    grunt.registerTask('css',     ['copy', 'compass', 'concat:css']);
    grunt.registerTask('default', ['clean', 'concat:js', 'css', 'jst']);

  };