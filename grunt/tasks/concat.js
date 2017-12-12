module.exports = {
  task: function(grunt, config) {
    return {
      themes: {
        options: {},
        files: {
          // CartoDB.js CSSs (themes?)
          '<%= dist %>/internal/themes/css/cartodb.css': [
            '.tmp/scss/**/*.css'
          ]
        }
      }
    }
  }
}
