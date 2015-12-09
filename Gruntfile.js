module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  var pkg = grunt.file.readJSON('package.json');

  var config = {
    dist: 'dist',
    tmp: '.tmp',
    pkg: pkg
  };

  grunt.initConfig({
    secrets: {},
    config: config,
    pkg: pkg,
    clean: require('./grunt-tasks/clean').task(),
    concat: require('./grunt-tasks/concat').task(grunt, config),
    copy: require('./grunt-tasks/copy').task(),
    cssmin: require('./grunt-tasks/cssmin').task(),
    imagemin: require('./grunt-tasks/imagemin').task(),
    sass: require('./grunt-tasks/scss').task(grunt, config)
  });

  // Define tasks order for each step as if run in isolation,
  // when registering the actual tasks _.uniq is used to discard duplicate tasks from begin run
  var allDeps = [
  ];
  var css = allDeps
    .concat();

  grunt.registerTask('default', [
    'clean:dist',
    'copy',
    'sass',
    'concat',
    'cssmin',
    'imagemin'
  ]);
};
