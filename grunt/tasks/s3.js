
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

      'js-major': {
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
            cwd: 'dist/public',
            src: '*.js',
            dest: "carto.js/v<%= version.major %>"
          }
        ]
      },

      'js-minor': {
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
            cwd: 'dist/public',
            src: '*.js',
            dest: "carto.js/v<%= version.minor %>"
          }
        ]
      },

      'js-patch': {
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
            cwd: 'dist/public',
            src: '*.js',
            dest: "carto.js/v<%= version.patch %>"
          }
        ]
      },

      'js-full': {
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
            cwd: 'dist/public',
            src: '*.js',
            dest: "carto.js/v<%= version.full %>"
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
