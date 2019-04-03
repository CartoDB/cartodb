module.exports = {
  task: function () {
    return {
      fonts: {
        expand: true,
        cwd: 'node_modules/cartoassets/src/fonts/',
        src: [ '**/*.{eot,ttf,woff,svg}' ],
        dest: '<%= dist %>/internal/themes/fonts'
      }
    };
  }
};
