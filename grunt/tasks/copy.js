module.exports = {
  task: function (grunt, config) {
    return {
      fonts: {
        expand: true,
        cwd: 'node_modules/cartoassets/src/fonts/',
        src: [ '**/*.{eot,ttf,woff,svg}' ],
        dest: '<%= config.dist %>/themes/fonts'
      }
    };
  }
};
