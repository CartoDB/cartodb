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
    clean: require('./grunt-tasks/clean'),
    concat: require('./grunt-tasks/concat'),
    connect: require('./grunt-tasks/connect'),
    copy: require('./grunt-tasks/copy'),
    cssmin: require('./grunt-tasks/cssmin'),
    browserify: require('./grunt-tasks/browserify'),
    imagemin: require('./grunt-tasks/imagemin'),
    jasmine: require('./grunt-tasks/jasmine'),
    sass: require('./grunt-tasks/scss'),
    watch: require('./grunt-tasks/watch'),
  });

  // required for browserify to use watch files instead
  grunt.registerTask('preWatch', grunt.config.bind(grunt.config, 'config.doWatchify', true));

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
  grunt.registerTask('build', baseTasks);
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
  grunt.registerTask('test', baseTasks.concat('jasmine'));
};
