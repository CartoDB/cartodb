var _ = require('underscore');

/**
 *  Grunfile runner file for CartoDB.js
 *  framework
 *
 */
module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);
  var semver = require('semver');

  var pkg = grunt.file.readJSON('package.json');

  if (!pkg.version || !semver.valid(pkg.version)) {
    grunt.fail.fatal('package.json version is not valid' , 1);
  }

  var version = pkg.version.split('.');
  var VERSION_OBJ =  {
      major:      version[0],
      minor:      version[0] + '.' + version[1],
      bugfixing:  pkg.version
   }

  var config = {
    dist: 'dist',
    tmp: '.tmp',
    version: {
      major:      version[0],
      minor:      version[0] + '.' + version[1],
      bugfixing:  pkg.version
    },
    pkg: pkg
  };

  grunt.initConfig({
    secrets: {},
    config: config,
    dist: 'dist',
    version: {
      major:      version[0],
      minor:      version[0] + '.' + version[1],
      bugfixing:  pkg.version
    },
    pkg:  pkg,
    gitinfo: {},
    // svg_sprite                  : {
    //     complex: {
    //
    //         // Target basics
    //         expand                  : true,
    //         cwd                     : 'themes',
    //         src                     : ['svg/*.svg'],
    //         dest                    : 'dist/svg',
    //
    //         // Target options
    //         options                 : {
    //             // shape               : {
    //             //     dimension       : {         // Set maximum dimensions
    //             //         maxWidth    : 32,
    //             //         maxHeight   : 32
    //             //     },
    //             //     spacing         : {         // Add padding
    //             //         padding     : 10
    //             //     },
    //             //     dest            : null, // 'out/intermediate-svg'    // Keep the intermediate files
    //             // },
    //             mode                : {
    //                 prefix: '.svgpito-%s',
    //                 view            : {         // Activate the «view» mode
    //                     bust        : false,
    //                     render      : {
    //                         css    : true
    //                     }
    //                 },
    //                 symbol          : false      // Activate the «symbol» mode
    //             }
    //         }
    //     }
    // },
    browserify: require('./grunt/tasks/browserify').task(grunt),
    exorcise: require('./grunt/tasks/exorcise').task(),
    s3: require('./grunt/tasks/s3').task(grunt, config),
    prompt: require('./grunt/tasks/prompt').task(grunt, config),
    replace: require('./grunt/tasks/replace').task(grunt, config),
    fastly: require('./grunt/tasks/fastly').task(grunt, config),
    sass: require('./grunt/tasks/scss').task(grunt, config),
    watch: require('./grunt/tasks/watch').task(),
    connect: require('./grunt/tasks/connect').task(config),
    clean: require('./grunt/tasks/clean').task(),
    concat: require('./grunt/tasks/concat').task(grunt, config),
    uglify: require('./grunt/tasks/uglify').task(),
    cssmin: require('./grunt/tasks/cssmin').task(),
    imagemin: require('./grunt/tasks/imagemin').task(),
    copy: require('./grunt/tasks/copy').task(grunt, config),
    jshint: require('./grunt/tasks/jshint').task(),
    jasmine: require('./grunt/tasks/jasmine').task()
  });

  grunt.registerTask('release', [
    'prompt:bump',
    'build'
  ]);

  // grunt.registerTask('svg', [
  //   'svg_sprite'
  // ]);

  grunt.registerTask('publish', function (target) {

    if (!grunt.file.exists('secrets.json')) {
      grunt.fail.fatal('secrets.json file does not exist, copy secrets.example.json and rename it' , 1);
    }

    // Read secrets
    grunt.config.set('secrets', grunt.file.readJSON('secrets.json'));

    if (
        !grunt.config('secrets') ||
        !grunt.config('secrets').S3_KEY ||
        !grunt.config('secrets').S3_SECRET ||
        !grunt.config('secrets').S3_BUCKET
      ) {
      grunt.fail.fatal('S3 keys not specified in secrets.json' , 1);
    }

    grunt.task.run([
      'jasmine', // Don't comment this line unless you have a GOOD REASON
      's3'
    ]);
  });

  grunt.registerTask('set_current_version', function() {
    var version = pkg.version;
    var minor = version.split('.');
    minor.pop()
    minor = minor.join('.');
    var options = {
      version: version,
      minor: minor,
      increment: 'build',
      bugfixing: version
    };

    // Check if version was set via prompt, and
    // use that version and not the package version
    var bump = grunt.config.get('bump');
    if (bump) {
      options = bump;
      options.bugfixing = bump.version;
    }

    grunt.config.set('bump', options);
  });

  grunt.registerTask('invalidate', function(){
    if (!grunt.file.exists('secrets.json')) {
      grunt.fail.fatal('secrets.json file does not exist, copy secrets.example.json and rename it' , 1);
    }

    // Read secrets
    grunt.config.set('secrets', grunt.file.readJSON('secrets.json'));

    if (!grunt.config('secrets') ||
        !grunt.config('secrets').FASTLY_API_KEY ||
        !grunt.config('secrets').FASTLY_CARTODB_SERVICE
      ) {
      grunt.fail.fatal('Fastly keys not specified in secrets.json' , 1);
    }

    grunt.task.run([
      'fastly'
    ]);
  });

  grunt.registerTask('preWatch', function() {
    grunt.config('config.doWatchify', true); // required for browserify to use watch files instead
  });

  grunt.event.once('connect.jasmine.listening', function(host, port) {
    grunt.log.writeln('Jasmine specs available at (one per bundle):');

    var jasmineConfig = grunt.config('jasmine');
    for (var name in jasmineConfig) {
      var specRunnerFilepath = jasmineConfig[name].options.outfile;
      grunt.task.run('jasmine:' + name + ':build')
      grunt.log.writeln(' - http://' + host + ':' + port + '/' + specRunnerFilepath);
    }
  });

  // Define tasks order for each step as if run in isolation,
  // when registering the actual tasks _.uniq is used to discard duplicate tasks from begin run
  var allDeps = [
    'set_current_version',
    'clean:dist',
    'replace',
    'gitinfo',
  ];
  var css = allDeps
    .concat([
      'sass',
      'concat',
      'cssmin',
      'imagemin',
    ]);
  var devCSS = css
    .concat('connect:styleguide');
  var js = allDeps
    .concat([
      'browserify',
    ]);
  var buildJS = allDeps
    .concat(js)
    .concat([
      'exorcise',
      'uglify',
    ]);
  var devJS = allDeps
    .concat('preWatch')
    .concat(js)
    .concat([
      'connect:jasmine',
      'connect:examples',
    ]);

  grunt.registerTask('default', [ 'build' ]);
  grunt.registerTask('build', _.uniq(buildJS.concat(css)));
  grunt.registerTask('build:js', _.uniq(buildJS));
  grunt.registerTask('build:css', _.uniq(css));
  grunt.registerTask('test', _.uniq(js.concat('jasmine')));
  grunt.registerTask('dev', _.uniq(devCSS.concat(devJS).concat('watch')));
  grunt.registerTask('dev:css', _.uniq(devCSS.concat('watch')));
  grunt.registerTask('dev:js', _.uniq(devJS.concat('watch')));
}
