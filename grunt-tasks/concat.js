module.exports = {
  task: function(grunt, config) {
    return {
      themes: {
        options: {},
        files: {
          '<%= config.dist %>/themes/css/deep-insights.css': [
            '.tmp/scss/**/*.css'
          ]
        }
      }
    }
  }
}
