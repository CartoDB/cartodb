
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
    gitinfo: {},
    s3: require('./grunt/tasks/s3').task(grunt, config),
    prompt: require('./grunt/tasks/prompt').task(grunt, config),
    replace: require('./grunt/tasks/replace').task(grunt, config),
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


  /* TASKS */

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

  grunt.registerTask('publish', function (target) {

    if (!grunt.file.exists('secrets.json')) {
      grunt.fail.fatal('secrets.json file does not exist, copy secrets.example.json and rename it' , 1);
    }

    // Read secrets 
    grunt.config.set('secrets', grunt.file.readJSON('secrets.json'));

    if (
        !grunt.config('secrets') ||
        !grunt.config('secrets').S3_KEY ||
        !grunt.config('secrets').S3_SECRET ||
        !grunt.config('secrets').S3_BUCKET
      ) {
      grunt.fail.fatal('S3 keys not specified in secrets.json' , 1);
    }

    grunt.task.run([
      'jasmine', // Don't comment this line unless you have a GOOD REASON
      's3'
    ]);
  });

  grunt.registerTask('invalidate', function(){
    if (!grunt.file.exists('secrets.json')) {
      grunt.fail.fatal('secrets.json file does not exist, copy secrets.example.json and rename it' , 1);
    }

    // Read secrets 
    grunt.config.set('secrets', grunt.file.readJSON('secrets.json'));

    if (!grunt.config('secrets') ||
        !grunt.config('secrets').FASTLY_API_KEY ||
        !grunt.config('secrets').FASTLY_CARTODB_SERVICE
      ) {
      grunt.fail.fatal('Fastly keys not specified in secrets.json' , 1);
    }

    grunt.task.run([
      'fastly'
    ]);
  });

  grunt.registerTask('pages', [ 'buildcontrol:pages' ]);

  grunt.registerTask('build', [
      'prompt:bump',
      'replace',
      'gitinfo',
      'clean:dist',
      'concurrent:dist',
      'useminPrepare',
      'concat',
      'autoprefixer:dist',
      'cssmin',
      'copy:distStatic',
      'imagemin',
      'svgmin',
      'filerev',
      'usemin',
      'htmlmin',
      'uglify'
  ]);

  grunt.registerTask('dist', [
    'build'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
}