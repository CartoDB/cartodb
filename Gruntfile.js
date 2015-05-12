
 require('shelljs/global');
 var timer = require("grunt-timer");

  /**
   *  CartoDB UI assets generation
   */

  module.exports = function(grunt) {

    if (timer) timer.init(grunt);

    var ROOT_ASSETS_DIR = './public/assets/';
    var ASSETS_DIR = './public/assets/<%= pkg.version %>';

    // use grunt --environment production
    var env = './config/grunt_' + (grunt.option('environment') || 'development') + '.json';
    if (grunt.file.exists(env)) {
      env = grunt.file.readJSON(env)
    } else {
      throw grunt.util.error(env +' file is missing! See '+ env +'.sample for how it should look like');
    }

    var aws = {};
    if (grunt.file.exists('./lib/build/grunt-aws.json')) {
      aws = grunt.file.readJSON('./lib/build/grunt-aws.json');
    }

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      aws: aws,
      env: env,
      gitrev: exec('git rev-parse HEAD', { silent:true }).output.replace('\n', ''),

      assets_dir: ASSETS_DIR,
      root_assets_dir: ROOT_ASSETS_DIR,

      browserify_modules: {
        tests: {
          dest: '.grunt/browserify_modules_tests.js'
        }
      },

      // Concat task
      concat:   require('./lib/build/tasks/concat').task(),

      // JST generation task
      jst:      require('./lib/build/tasks/jst').task(),

      // Compass files generation
      compass:  require('./lib/build/tasks/compass').task(),

      // Copy assets (stylesheets, javascripts, images...)
      copy:     require('./lib/build/tasks/copy').task(grunt),

      // Watch actions
      watch: require('./lib/build/tasks/watch.js').task(),

      // Clean folders before other tasks
      clean:    require('./lib/build/tasks/clean').task(),

      // Jasmine tests
      jasmine:  require('./lib/build/tasks/jasmine.js').task(),

      s3: require('./lib/build/tasks/s3.js').task(),

      exorcise: require('./lib/build/tasks/exorcise.js').task(),

      uglify: require('./lib/build/tasks/uglify.js').task(),

      browserify: require('./lib/build/tasks/browserify.js').task(),

      connect: require('./lib/build/tasks/connect.js').task(),

      availabletasks: require('./lib/build/tasks/availabletasks.js').task()
    });

    // $ grunt availabletasks
    grunt.loadNpmTasks('grunt-available-tasks');

    // Load Grunt tasks
    require('load-grunt-tasks')(grunt);

    require('./lib/build/tasks/manifest').register(grunt, ASSETS_DIR);

    // builds cdb
    grunt.registerTask('cdb', "builds cartodb.js", function() {
      var done = this.async();
      require("child_process").exec('make update_cdb', function (error, stdout, stderr) {
        if (error) {
          grunt.log.fail('cartodb.js not updated (due to '+ stdout +", "+ stderr +")");
        } else {
          grunt.log.ok('cartodb.js updated');
        }
        done();
      });
    });

    grunt.registerTask('invalidate', "invalidate cache", function() {
      var done = this.async();
      var cmd = grunt.template.process("curl -H 'Fastly-Key: <%= aws.FASTLY_API_KEY %>' -X POST 'https://api.fastly.com/service/<%= aws.FASTLY_CARTODB_SERVICE %>/purge_all'");
      console.log(cmd);
      require("child_process").exec(cmd, function(error, stdout, stderr) {
        if (!error) {
          grunt.log.ok('CDN invalidated (fastly) -> ' + stdout);
        } else {
          grunt.log.error('CDN not invalidated (fastly)');
        }
        done();
      });
    });

    grunt.registerTask('config', "generates assets config for current configuration", function() {
      // Set assets url for static assets in our app
      var config = grunt.template.process("cdb.config.set('assets_url', '<%= env.http_path_prefix %>/assets/<%= pkg.version %>');");
      config += grunt.template.process("\nconsole.log('cartodbui v<%= pkg.version %> sha1: <%= gitrev %>');");
      grunt.file.write("lib/build/app_config.js", config);
    });

    grunt.registerTask('check_release', "checks release can be done", function() {
      if (env === 'development') {
        grunt.log.error("you can't release running development enviorment");
        return false;
      }
      grunt.log.ok("************************************************");
      grunt.log.ok(" you are going to deploy to " + env );
      grunt.log.ok("************************************************");
    });

    grunt.event.on('watch', function(action, filepath) {
      // configure copy vendor to only run on changed file
      var cfg = grunt.config.get('copy.vendor');
      if (filepath.indexOf(cfg.cwd) !== -1) {
        grunt.config('copy.vendor.src', filepath.replace(cfg.cwd, ''));
      } else {
        grunt.config('copy.vendor.src', []);
      }

      // configure copy app to only run on changed file
      var files = grunt.config.get('copy.app.files');
      for (var i = 0; i < files.length; ++i) {
        var cfg = grunt.config.get('copy.app.files.' + i);
        if (filepath.indexOf(cfg.cwd) !== -1) {
          grunt.config('copy.app.files.' + i + '.src', filepath.replace(cfg.cwd, ''));
        } else {
          grunt.config('copy.app.files.' + i + '.src', []);
        }
      }
    });

    grunt.registerTask('setConfig', 'Set a config property', function(name, val) {
      grunt.config.set(name, val);
    });

    grunt.registerTask('jasmine-server', 'start web server for jasmine tests in browser', function() {
      grunt.task.run('jasmine:cartodbui:build');

      grunt.event.once('connect.jasmine.listening', function(host, port) {
        var specRunnerUrl = 'http://localhost:' + port + '/_SpecRunner.html';
        grunt.log.writeln('Jasmine specs available at: ' + specRunnerUrl);
        require('open')(specRunnerUrl);
      });

      grunt.task.run('connect:jasmine:keepalive');
    });

    // Order in terms of task dependencies
    grunt.registerTask('js',          ['cdb', 'browserify', 'concat:js', 'jst']);
    grunt.registerTask('pre_default', ['clean', 'config', 'js']);
    grunt.registerTask('test', '(CI env) Re-build JS files and run all tests. ' +
    'For manual testing use `grunt jasmine` directly', ['pre_default', 'jasmine']);
    grunt.registerTask('css',         ['copy:vendor', 'copy:app', 'compass', 'concat:css']);
    grunt.registerTask('default',     ['pre_default', 'css', 'manifest']);
    grunt.registerTask('minimize',    ['default', 'copy:js', 'exorcise', 'uglify']);
    grunt.registerTask('release',     ['check_release', 'minimize', 's3', 'invalidate']);
    grunt.registerTask('dev',         'Typical task for frontend development (watch JS/CSS changes)',
      ['setConfig:env.browserify_watch:true', 'browserify', 'watch']);
    grunt.registerTask('sourcemaps', 'generate sourcemaps, to be used w/ trackjs.com for bughunting',
      ['setConfig:assets_dir:./tmp/sourcemaps', 'config', 'js', 'copy:js', 'exorcise', 'uglify']);
  };
