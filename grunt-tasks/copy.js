module.exports = {
  fonts: {
    files: [{
      expand: true,
      cwd: 'node_modules/cartoassets/src/fonts',
      src: ['**/*'],
      dest: '<%= config.dist %>/themes/fonts'
    }]
  }
};
