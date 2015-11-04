module.exports = {
  task: function(grunt, config) {
    return {
      themes: {
        options: {},
        files: {
          // CartoDB.js CSSs (themes?)
          '<%= config.dist %>/themes/css/cartodb.css': [
            '.tmp/scss/**/*.css'
          ]
        }
      }
    }
  }
}
