module.exports = {
  themes: {
    options: {},
    files: {
      '<%= config.dist %>/themes/css/deep-insights.css': [
        '.tmp/scss/**/*.css'
      ]
    }
  }
}
