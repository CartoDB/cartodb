var semver = require('semver');

/**
 *  S3 upload grunt task for CARTO.js
 *
 */

module.exports = {
  task: function(version) {
    var tasks = {
      options: {
        accessKeyId: "<%= secrets.AWS_USER_S3_KEY %>",
        secretAccessKey: "<%= secrets.AWS_USER_S3_SECRET %>",
        bucket: "<%= secrets.AWS_S3_BUCKET %>",
        dryRun: false
      }
    };

    var major = semver.major(version);
    var minor = semver.minor(version);
    var patch = semver.patch(version);
    var prerelease = semver.prerelease(version);

    if (prerelease) {
      /**
       * Publish prerelease URLs
       */
      var base = 'carto.js/v' + major + '.' + minor + '.' + patch + '-';
      if (prerelease[0]) { // alpha, beta, rc
        tasks['js-prerelease'] = createTask(base + prerelease[0]);
      }
      if (prerelease[1]) { // number
        tasks['js-prerelease-number'] = createTask(base + prerelease[0] + '.' + prerelease[1]);
      }
    } else {
      /**
       * Publish release URLs
       */
      tasks['js-major'] = createTask('carto.js/v' + major);
      tasks['js-minor'] = createTask('carto.js/v' + major + '.' + minor);
      tasks['js-patch'] = createTask('carto.js/v' + major + '.' + minor + '.' + patch);
    }

    function createTask(dest) {
      return  {
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
            action: 'upload',
            expand: true,
            cwd: 'dist/public',
            src: '*.js',
            dest: dest
          }
        ]
      };
    }

    return tasks;
  }
}
