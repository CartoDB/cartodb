
/**
 *  S3 upload grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function(grunt, config, aws) {
    
    return {
      options: {
        accessKeyId: "<%= aws.S3_KEY %>",
        secretAccessKey: "<%= aws.S3_SECRET %>",
        bucket: "<%= aws.S3_BUCKET %>",
        dryRun: false
      },

      testing: {
        options: {
          overwrite: false,
          params: {
            ContentEncoding: 'gzip'
          }
        },
        files: [
          {
            'action': 'upload',
            expand: true,
            cwd: 'dist',
            src: ['**'],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          }, {
            'action': 'upload',
            expand: true,
            cwd: 'dist',
            src: ['**'],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.minor %>"
          }
        ]
      }
    }
  }
}