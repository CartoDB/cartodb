module.exports = {
  fonts: {
    files: [{
      expand: true,
      cwd: 'themes/fonts/',
      src: ['**/*'],
      dest: '<%= config.dist %>/fonts/'
    }]
  }
}
