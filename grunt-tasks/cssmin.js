module.exports = {
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
