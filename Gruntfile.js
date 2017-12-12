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

  var version = grunt.file.readJSON('package.json').version;

  if (!version || !semver.valid(version)) {
    grunt.fail.fatal('package.json version is not valid', 1);
  }

  grunt.initConfig({
    secrets: {},
    dist: 'dist',
    tmp: '.tmp',
    version: version,
    gitinfo: {},
    browserify: require('./grunt/tasks/browserify').task(),
    exorcise: require('./grunt/tasks/exorcise').task(),
    s3: require('./grunt/tasks/s3').task(version),
    fastly: require('./grunt/tasks/fastly').task(),
    sass: require('./grunt/tasks/scss').task(),
    watch: require('./grunt/tasks/watch').task(),
    connect: require('./grunt/tasks/connect').task(),
    copy: require('./grunt/tasks/copy').task(),
    clean: require('./grunt/tasks/clean').task(),
    concat: require('./grunt/tasks/concat').task(),
    uglify: require('./grunt/tasks/uglify').task(),
    cssmin: require('./grunt/tasks/cssmin').task(),
    imagemin: require('./grunt/tasks/imagemin').task(),
    jasmine: jasmineCfg,
    eslint: { target: getTargetDiff() }
  });

  grunt.registerTask('publish_s3', function (target) {
    if (!grunt.file.exists('secrets.json')) {
      grunt.fail.fatal('secrets.json file does not exist, copy secrets.example.json and rename it', 1);
    }

    // Read secrets
    grunt.config.set('secrets', grunt.file.readJSON('secrets.json'));

    if (!grunt.config('secrets') ||
        !grunt.config('secrets').AWS_USER_S3_KEY ||
        !grunt.config('secrets').AWS_USER_S3_SECRET ||
        !grunt.config('secrets').AWS_S3_BUCKET
    ) {
      grunt.fail.fatal('S3 keys not specified in secrets.json', 1);
    }

    grunt.task.run([
      's3'
    ]);
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
