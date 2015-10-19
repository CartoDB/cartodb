
/**
 *  Grunfile runner file for CartoDB.js
 *  framework
 *
 */
module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);
  var semver = require('semver');

  var pkg = grunt.file.readJSON('package.json');

  if (!pkg.version || !semver.valid(pkg.version)) {
    grunt.fail.fatal('package.json version is not valid' , 1);
  }

  var version = pkg.version.split('.');
  var VERSION_OBJ =  {
      major:      version[0],
      minor:      version[0] + '.' + version[1],
      bugfixing:  pkg.version
   }

  var config = {
    dist: 'dist',
    tmp: '.tmp',
    version: {
      major:      version[0],
      minor:      version[0] + '.' + version[1],
      bugfixing:  pkg.version
    },
    pkg: pkg
  };

  grunt.initConfig({
    secrets: {},
    config: config,
    dist: 'dist',
    version: {
      major:      version[0],
      minor:      version[0] + '.' + version[1],
      bugfixing:  pkg.version
    },
    pkg:  pkg,
    gitinfo: {},
    browserify: require('./grunt/tasks/browserify').task(),
    s3: require('./grunt/tasks/s3').task(grunt, config),
    prompt: require('./grunt/tasks/prompt').task(grunt, config),
    replace: require('./grunt/tasks/replace').task(grunt, config),
    fastly: require('./grunt/tasks/fastly').task(grunt, config),
    sass: require('./grunt/tasks/scss').task(grunt, config),
    watch: require('./grunt/tasks/watch').task(),
    connect: require('./grunt/tasks/connect').task(config),
    clean: require('./grunt/tasks/clean').task(),
    concat: require('./grunt/tasks/concat').task(grunt, config),
    uglify: require('./grunt/tasks/uglify').task(),
    cssmin: require('./grunt/tasks/cssmin').task(),
    imagemin: require('./grunt/tasks/imagemin').task(),
    copy: require('./grunt/tasks/copy').task(grunt, config),
    jshint: require('./grunt/tasks/jshint').task(),
    jasmine: require('./grunt/tasks/jasmine').task()
  });

  grunt.registerTask('test', [ 'dist_js', 'jasmine' ]);

  grunt.registerTask('release', [
    'prompt:bump',
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

  grunt.registerTask('set_current_version', function() {
    var version = pkg.version;
    var minor = version.split('.');
    minor.pop()
    minor = minor.join('.');
    var options = {
      version: version,
      minor: minor,
      increment: 'build',
      bugfixing: version
    };

    // Check if version was set via prompt, and
    // use that version and not the package version
    var bump = grunt.config.get('bump');
    if (bump) {
      options = bump;
      options.bugfixing = bump.version;
    }

    grunt.config.set('bump', options);
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

  grunt.registerTask('build', [
    'clean:dist',
    'css',
    'dist_js',
    'cssmin',
    'imagemin',
    'uglify'
  ]);

  grunt.registerTask('dist_js', [
    'set_current_version',
    'replace',
    'gitinfo',
    'concat',
    'browserify'
  ]);

  grunt.registerTask('css', [ 'sass' ]);

  grunt.registerTask('dist', [
    'set_current_version',
    'build'
  ]);

  grunt.registerTask('default', [
    'dist'
  ]);

  grunt.registerTask('preWatch', function() {
    grunt.config('config.doWatchify', true);
    try {
      grunt.task.requires('gitinfo');
    } catch(err) {
      grunt.task.run('gitinfo');
    }
  });

  grunt.registerTask('dev', [
    'build',
    'connect:styleguide',
    'jasmine-server',
    'preWatch',
    'browserify',
    'watch'
  ]);

  // Required for source-map-support install to work in a non-headless browserify
  // Use this instead of opening test/SpecRunner-*.html files directly
  grunt.registerTask('jasmine-server', 'start web server for jasmine tests in browser', function() {
    grunt.task.run('jasmine:core:build');

    var specRunnerURL = function(host, port, specrunner) {
      return 'http://' + host + ':' + port + '/' + specrunner;
    }
    grunt.event.once('connect.jasmine.listening', function(host, port) {
      var url = specRunnerURL.bind(this, host, port);
      var primaryURL = url('test/SpecRunner-core.html');
      grunt.log.writeln('Jasmine specs available at: ' + primaryURL);
    });

    grunt.task.run('connect:jasmine:keepalive');
  });
}
