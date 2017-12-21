
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

      'js-bugfixing': {
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
            dest: "di.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          }
        ]
      },

      'js-minor': {
        options: {
          overwrite: true,
          cache: false,
          gzip: true,
          // It will not upload minor vesion when it comes from a
          // custom version, because it could overwrite production
          // version
          dryRun: isVersionPrerelease(config.version.bugfixing),
          headers: {
            ContentType: 'application/x-javascript'
          }
        },
        files: [{
            // Minor version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              '*.js',
              '!_*.js'
            ],
            dest: "di.js/v<%= config.version.major %>/<%= config.version.minor %>"
          }
        ]
      },

      'css-bugfixing': {
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
            dest: "di.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          }
        ]
      },

      'css-minor': {
        options: {
          overwrite: true,
          cache: false,
          dryRun: isVersionPrerelease(config.version.bugfixing),
          gzip: true,
          headers: {
            ContentType: 'text/css'
          }
        },
        files: [{
            // Minor version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              'themes/**/*.css'
            ],
            dest: "di.js/v<%= config.version.major %>/<%= config.version.minor %>"
          }
        ]
      },

      'png-bugfixing': {
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
            dest: "di.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          }
        ]
      },

      'png-minor': {
        options: {
          overwrite: true,
          cache: false,
          gzip: false,
          headers: {
            ContentType: 'image/png'
          },
          dryRun: isVersionPrerelease(config.version.bugfixing)
        },
        files: [
          {
            // Minor version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              'themes/**/*.png'
            ],
            dest: "di.js/v<%= config.version.major %>/<%= config.version.minor %>"
          }
        ]
      },

      'gif-bugfixing': {
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
            dest: "di.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          }
        ]
      },

      'gif-minor': {
        options: {
          overwrite: true,
          cache: false,
          gzip: false,
          headers: {
            ContentType: 'image/gif'
          },
          dryRun: isVersionPrerelease(config.version.bugfixing)
        },
        files: [
          {
            // Minor version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              'themes/**/*.gif'
            ],
            dest: "di.js/v<%= config.version.major %>/<%= config.version.minor %>"
          }
        ]
      },

      'fonts-bugfix': {
        options: {
          overwrite: true,
          cache: false,
          gzip: false,
          headers: {
            ContentType: 'application/font-woff'
          },
          dryRun: false
        },
        files: [
          {
            // Minor version
            action: 'upload',
            expand: true,
            cwd: 'dist',
            src: [
              'themes/**/*.woff'
            ],
            dest: "di.js/v<%= config.version.major %>/<%= config.version.bugfixing %>"
          }
        ]
      }
    }
  }
}


// How to know if the version is prerelease or
// not :(
function isVersionPrerelease(v) {
  var v = v.split('.');
  return !/^[0-9]+$/.test(v[v.length - 1]);
}
