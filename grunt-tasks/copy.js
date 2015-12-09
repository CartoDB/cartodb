module.exports = {
  task: function() {
    return {
      fonts: {
        files: [{
          expand: true,
          cwd: 'themes/fonts/',
          src: ['**/*'],
          dest: '<%= config.dist %>/fonts/'
        }]
      }
    }
  }
}
