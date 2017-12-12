var _ = require('underscore');
var jasmineCfg = require('./grunt/tasks/jasmine');

function getTargetDiff () {
  // Detect changed files. If no changes return '.' (all files)
  var target = require('child_process').execSync('(git diff --name-only --relative || true;)' +
                                                 '| grep \'\\.js\\?$\' || true').toString();
  if (target.length === 0) {
    target = ['.'];
  } else {
    target = target.split('\n');
    target.splice(-1, 1);
  }
  return target;
}

/**
 *  Grunfile runner file for CartoDB.js
 *  framework
 *
 */
module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);
  var semver = require('semver');

  var pkg = grunt.file.readJSON('package.json');

  if (!pkg.version || !semver.valid(pkg.version)) {
    grunt.fail.fatal('package.json version is not valid', 1);
  }

  var version = pkg.version.split('.');

  var config = {
  };

  grunt.initConfig({
    secrets: {},
    config: config,
    dist: 'dist',
    tmp: '.tmp',
    version: {
      major: version[0],
      minor: version[0] + '.' + version[1],
      patch: version[0] + '.' + version[1] + '.' + version[2]
    },
    pkg: pkg,
    gitinfo: {},
    browserify: require('./grunt/tasks/browserify').task(grunt),
    exorcise: require('./grunt/tasks/exorcise').task(),
    s3: require('./grunt/tasks/s3').task(grunt, config),
    fastly: require('./grunt/tasks/fastly').task(grunt, config),
    sass: require('./grunt/tasks/scss').task(grunt, config),
    watch: require('./grunt/tasks/watch').task(),
    connect: require('./grunt/tasks/connect').task(config),
    copy: require('./grunt/tasks/copy').task(config),
    clean: require('./grunt/tasks/clean').task(),
    concat: require('./grunt/tasks/concat').task(grunt, config),
    uglify: require('./grunt/tasks/uglify').task(),
    cssmin: require('./grunt/tasks/cssmin').task(),
    imagemin: require('./grunt/tasks/imagemin').task(),
    jasmine: jasmineCfg,
    eslint: { target: getTargetDiff() }
  });

  grunt.registerTask('publish', function (target) {
    if (!grunt.file.exists('secrets.json')) {
      grunt.fail.fatal('secrets.json file does not exist, copy secrets.example.json and rename it', 1);
    }

    // Read secrets
    grunt.config.set('secrets', grunt.file.readJSON('secrets.json'));

    if (
      !grunt.config('secrets') ||
        !grunt.config('secrets').S3_KEY ||
        !grunt.config('secrets').S3_SECRET ||
        !grunt.config('secrets').S3_BUCKET
    ) {
      grunt.fail.fatal('S3 keys not specified in secrets.json', 1);
    }

    grunt.task.run([
      'jasmine', // Don't comment this line unless you have a GOOD REASON
      's3'
    ]);
  });

  grunt.registerTask('set_current_version', function () {
    var version = pkg.version;
    grunt.config.set('version', version);
  });

  grunt.registerTask('invalidate', function () {
    if (!grunt.file.exists('secrets.json')) {
      grunt.fail.fatal('secrets.json file does not exist, copy secrets.example.json and rename it', 1);
    }

    // Read secrets
    grunt.config.set('secrets', grunt.file.readJSON('secrets.json'));

    if (!grunt.config('secrets') ||
        !grunt.config('secrets').FASTLY_API_KEY ||
        !grunt.config('secrets').FASTLY_CARTODB_SERVICE
    ) {
      grunt.fail.fatal('Fastly keys not specified in secrets.json', 1);
    }

    grunt.task.run([
      'fastly'
    ]);
  });

  grunt.registerTask('preWatch', function () {
    grunt.config('doWatchify', true); // required for browserify to use watch files instead
  });

  grunt.registerTask('build-jasmine-specrunners', _
    .chain(jasmineCfg)
    .keys()
    .map(function (name) {
      return ['jasmine', name, 'build'].join(':');
    })
    .value());

  // Define tasks order for each step as if run in isolation,
  // when registering the actual tasks _.uniq is used to discard duplicate tasks from begin run
  var allDeps = [
    'set_current_version',
    'clean:dist_internal',
    'gitinfo',
    'copy:fonts'
  ];
  var css = allDeps
    .concat([
      'sass',
      'concat',
      'cssmin',
      'imagemin'
    ]);
  var js = allDeps
    .concat([
      'browserify',
      'build-jasmine-specrunners'
    ]);
  var buildJS = allDeps
    .concat(js)
    .concat([
      'exorcise',
      'uglify'
    ]);
  var devJS = allDeps
    .concat('preWatch')
    .concat(js);
  var watch = [
    'connect',
    'watch'
  ];

  grunt.registerTask('default', [ 'build' ]);
  grunt.registerTask('build', _.uniq(buildJS.concat(css)));
  grunt.registerTask('build:js', _.uniq(buildJS));
  grunt.registerTask('build:css', _.uniq(css));
  grunt.registerTask('test', _.uniq(js.concat([
    'eslint',
    'jasmine'
  ])));
  grunt.registerTask('dev', _.uniq(css.concat(devJS).concat(watch)));
  grunt.registerTask('dev:css', _.uniq(css.concat(watch)));
  grunt.registerTask('dev:js', _.uniq(devJS.concat(watch)));
};
