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

  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', [
    'clean:dist',

    'copy',
    'sass',
    'concat',
    'cssmin',
    'imagemin',

    'browserify',
  ]);
  grunt.registerTask('dev', [
    'clean:dist',

    'copy',
    'sass',
    'concat',
    'cssmin',
    'imagemin',

    'preWatch', // required to be run before browserify, to use watchify instead
    'browserify',
    'connect',
    'watch',
  ])
};
