
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

      'js-dist': {
        options: {
          overwrite: true,
          cache: false,
          gzip: true,
          headers: {
            ContentType: 'application/x-javascript'
          }
        },
        files: [
          {
            // Bug fixing version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              '*.js',
              '!_*.js'
            ],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          },{
            // Minor version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              '*.js',
              '!_*.js'
            ],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.minor %>"
          }
        ]
      },

      'css-dist': {
        options: {
          overwrite: true,
          cache: false,
          gzip: true,
          headers: {
            ContentType: 'text/css'
          }
        },
        files: [
          {
            // Bug fixing version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              'themes/**/*.css'
            ],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          },{
            // Minor version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              'themes/**/*.css'
            ],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.minor %>"
          }
        ]
      },

      'png-dist': {
        options: {
          overwrite: true,
          cache: false,
          gzip: false,
          headers: {
            ContentType: 'image/png'
          }
        },
        files: [
          {
            // Bug fixing version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              'themes/**/*.png'
            ],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          },{
            // Minor version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              'themes/**/*.png'
            ],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.minor %>"
          }
        ]
      },

      'gif-dist': {
        options: {
          overwrite: true,
          cache: false,
          gzip: false,
          headers: {
            ContentType: 'image/gif'
          }
        },
        files: [
          {
            // Bug fixing version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              'themes/**/*.gif'
            ],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          },{
            // Minor version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              'themes/**/*.gif'
            ],
            dest: "testing/cartodb.js/v<%= config.version.major %>/<%= config.version.minor %>"
          }
        ]
      }
    }
  }
}