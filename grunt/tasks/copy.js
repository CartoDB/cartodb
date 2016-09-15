module.exports = {
  task: function (grunt, config) {
    return {
      fonts: {
        expand: true,
        cwd: 'themes/fonts',
        src: [ '**/*.{eot,ttf,woff}' ],
        dest: '<%= config.dist %>/themes/fonts'
      }
    };
  }
};
