
/**
 *  Css lint grunt task for CARTO.js
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
          banner: '/* CartoDB.css minified version: <%= version %> */',
          check: 'gzip'
        },
        files: {
          '<%= dist %>/internal/themes/css/cartodb.css': ['<%= dist %>/internal/themes/css/cartodb.css']
        }
      }

    }
  }
}
