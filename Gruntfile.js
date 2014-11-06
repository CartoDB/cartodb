
/**
 *  Grunfile runner file for CartoDB.js
 *  framework
 *
 */


module.exports = function(grunt) {
  
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  var pkg = grunt.file.readJSON('package.json');
  var version = pkg.version.split('.');

  // Checking if version is correctly defined
  if (version.length !== 3) {
    grunt.fail.fatal('Package version not correctly specified, it should be (xx.xx.xx or xx.xx.xx-dev)' , 1)
  }

  var config = {
    dist: 'dist',
    app:  'www',
    version: {
      major:      version[0],
      minor:      version[0] + '.' + version[1],
      bugfixing:  pkg.version
    },
    pkg:  pkg
  };

  grunt.initConfig({
    config: config,
    secrets: grunt.file.readJSON('secrets.json'),
    gitinfo: {},
    s3: require('./grunt/tasks/s3').task(grunt, config),
    fastly: require('./grunt/tasks/fastly').task(grunt, config),
    watch: require('./grunt/tasks/watch').task(),
    connect: require('./grunt/tasks/connect').task(config),
    clean: require('./grunt/tasks/clean').task(),
    compass: require('./grunt/tasks/compass').task(),
    autoprefixer: require('./grunt/tasks/autoprefixer').task(),
    useminPrepare: require('./grunt/tasks/useminPrepare').task(),
    usemin: require('./grunt/tasks/usemin').task(),
    htmlmin: require('./grunt/tasks/htmlmin').task(),
    concat: require('./grunt/tasks/concat').task(grunt, config),
    uglify: require('./grunt/tasks/uglify').task(),
    cssmin: require('./grunt/tasks/cssmin').task(),
    imagemin: require('./grunt/tasks/imagemin').task(),
    svgmin: require('./grunt/tasks/svgmin').task(),
    copy: require('./grunt/tasks/copy').task(grunt, config),
    filerev: require('./grunt/tasks/filerev').task(),
    buildcontrol: require('./grunt/tasks/buildcontrol').task(),
    jshint: require('./grunt/tasks/jshint').task(),
    csslint: require('./grunt/tasks/csslint').task(),
    concurrent: require('./grunt/tasks/concurrent').task(),
    jasmine: require('./grunt/tasks/jasmine').task()
  });


  /* -> Tasks

  - [X] server | serve => serve static cartodb.js webpage
  - [x] release => build
  - [ ] publish => publish cartodb.js library
  - [X] dist
  - [X] clean
  - [X] invalidate
  - [X] test
  - [X] build
  - [X] deploy => deploy static cartodb.js webpage
  - [ ] watch => special watch for cartodb.js library ;)

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

  grunt.registerTask('test', [ 'jasmine' ]);

  grunt.registerTask('release', [
    'build'
  ]);

  grunt.registerTask('publish', [
    // 'jasmine',
    's3'
  ]);

  grunt.registerTask('invalidate', [
    'fastly'
  ]);

  grunt.registerTask('deploy', [ 'buildcontrol:pages' ]);

  grunt.registerTask('build', [
    'gitinfo',
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

  grunt.registerTask('dist', [
    'gitinfo',
    'concat',
    'uglify'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
}