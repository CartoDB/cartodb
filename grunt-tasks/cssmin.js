module.exports = {
  task: function() {
    return {
      themes: {
        options: {
          check: 'gzip'
        },
        files: {
          '<%= config.dist %>/themes/css/deep-insights.css': [
            '<%= config.dist %>/themes/css/deep-insights.css'
          ]
        }
      }
    }
  }
}
