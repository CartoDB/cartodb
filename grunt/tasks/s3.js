
/**
 *  S3 upload grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function(grunt, config) {
    
    return {
      options: {
        accessKeyId: "<%= secrets.S3_KEY %>",
        secretAccessKey: "<%= secrets.S3_SECRET %>",
        bucket: "<%= secrets.S3_BUCKET %>",
        dryRun: false
      },

      dist: {
        options: {
          overwrite: true,
          cache: false,
          params: {
            ContentEncoding: 'gzip'
          }
        },
        files: [
          {
            'action': 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              '*.js',
              '!_*.js',
              'themes/**/*'
            ],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          }, {
            'action': 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              '*.js',
              '!_*.js',
              'themes/**/*'
            ],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.minor %>"
          }
        ]
      }
    }
  }
}