module.exports = {
  task: function() {
    return {
      themes: {
        options: {},
        files: {
          // Carto.js CSSs (themes?)
          '<%= dist %>/internal/themes/css/cartodb.css': [
            '.tmp/scss/**/*.css'
          ]
        }
      }
    }
  }
}
