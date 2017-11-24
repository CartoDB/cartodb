
/**
 *  Css lint grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function() {
    return {
      dist: {
        options: {
          check: 'gzip'
        }
      },

      themes: {
        options: {
          banner: '/* CartoDB.css minified version: <%= config.version.bugfixing %> */',
          check: 'gzip'
        },
        files: {
          '<%= config.dist %>/internal/themes/css/cartodb.css': ['<%= config.dist %>/internal/themes/css/cartodb.css']
        }
      }

    }
  }
}
