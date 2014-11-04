
/**
 *  Grunfile runner file for CartoDB.js
 *  framework
 *
 */


module.exports = function(grunt) {
  
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  var config = {
    dist: 'dist/www',
    app:  'www',
    pkg:  grunt.file.readJSON('package.json')
  };

  grunt.initConfig({
    config: config,
    watch: require('./grunt/tasks/watch').task(),
    connect: require('./grunt/tasks/connect').task(),
    clean: require('./grunt/tasks/clean').task(),
    compass: require('./grunt/tasks/compass').task(),
    autoprefixer: require('./grunt/tasks/autoprefixer').task(),
    useminPrepare: require('./grunt/tasks/useminPrepare').task(),
    usemin: require('./grunt/tasks/usemin').task(),
    htmlmin: require('./grunt/tasks/htmlmin').task(),
    concat: {},
    uglify: {},
    cssmin: require('./grunt/tasks/cssmin').task(),
    imagemin: require('./grunt/tasks/imagemin').task(),
    svgmin: require('./grunt/tasks/svgmin').task(),
    copy: require('./grunt/tasks/copy').task(grunt, config),
    filerev: require('./grunt/tasks/filerev').task(),
    buildcontrol: require('./grunt/tasks/buildcontrol').task(),
    jshint: require('./grunt/tasks/jshint').task(),
    csslint: require('./grunt/tasks/csslint').task(),
    concurrent: require('./grunt/tasks/concurrent').task()
  });


  /* -> Tasks

  - [X] server | serve => serve static cartodb.js webpage
  - [ ] release => 
  - [ ] publish => publish cartodb.js library
  - [ ] dist === build
  - [ ] clean
  - [ ] invalidate
  - [ ] test
  - [ ] build
  - [X] deploy => deploy static cartodb.js webpage

  */


  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'concurrent:server',
      'autoprefixer:server',
      'copy:stageStatic',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('server', function (target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run([target ? ('serve:' + target) : 'serve']);
  });

  grunt.registerTask('check', [
    'clean:server',
    'compass:server',
    'jshint:all',
    'csslint:check'
  ]);

  grunt.registerTask('release', [

  ]);

  grunt.registerTask('deploy', [
    'buildcontrol:pages'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'concurrent:dist',
    'useminPrepare',
    'concat',
    'autoprefixer:dist',
    'cssmin',
    'uglify',
    'imagemin',
    'svgmin',
    'filerev',
    'usemin',
    'htmlmin'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
}