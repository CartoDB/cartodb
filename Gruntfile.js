var _ = require('underscore');

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.initConfig({
    config: {
      dist: 'dist',
      tmp: '.tmp',
    },
    pkg: grunt.file.readJSON('package.json'),
    browserify: require('./grunt-tasks/browserify'),
    clean: require('./grunt-tasks/clean'),
    concat: require('./grunt-tasks/concat'),
    connect: require('./grunt-tasks/connect'),
    copy: require('./grunt-tasks/copy'),
    cssmin: require('./grunt-tasks/cssmin'),
    exorcise: require('./grunt-tasks/exorcise'),
    imagemin: require('./grunt-tasks/imagemin'),
    jasmine: require('./grunt-tasks/jasmine'),
    sass: require('./grunt-tasks/scss'),
    uglify: require('./grunt-tasks/uglify'),
    watch: require('./grunt-tasks/watch')
  });

  // required for browserify to use watch files instead
  grunt.registerTask('preWatch', grunt.config.bind(grunt.config, 'config.doWatchify', true));

  grunt.registerTask('lint', 'lint source files', function() {
    var done = this.async();
    require("child_process").exec('PATH=$(npm bin):$PATH semistandard', function (error, stdout, stderr) {
      if (error) {
        grunt.log.fail(error);

        // Filter out lines that are ignored,
        // e.g. "src/foobar.js:0:0: File ignored because of your .eslintignore file. Use --no-ignore to override."
        grunt.log.fail(stdout.replace(/.+--no-ignore.+(\r?\n|\r)/g, ''));
        grunt.fail.warn('try `node_modules/.bin/semistandard --format src/filename.js` to auto-format code (you might still need to fix some things manually).')
      } else {
        grunt.log.ok('All linted files OK!');
        grunt.log.writeln('Note that files listed in .eslintignore are not linted');
      }
      done();
    });
  });

  var baseTasks = [
    'clean:dist',
    'copy',
    'sass',
    'concat',
    'cssmin',
    'imagemin',
    'browserify',
  ];

  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', baseTasks.concat([
    'exorcise',
    'uglify'
  ]));
  grunt.registerTask('dev',
    _.chain(baseTasks)
      .clone()
      .tap(function(tasks) {
        var browserifyIdx = tasks.indexOf('browserify');
        tasks.splice(browserifyIdx, 0, 'preWatch'); // add preWatch before browserify task
        tasks.splice(tasks.length, 0, 'connect', 'watch'); // splice to append more tasks at end
      })
      .value()
  );
  grunt.registerTask('test', baseTasks.concat([
    'lint',
    'jasmine'
  ]));
};
