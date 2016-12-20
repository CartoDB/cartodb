 var _ = require('underscore');
 var timer = require("grunt-timer");
 var jasmineCfg = require('./lib/build/tasks/jasmine.js');
 var duplicatedDependencies = require('./lib/build/tasks/shrinkwrap-duplicated-dependencies.js');

 var REQUIRED_NPM_VERSION = /2.14.[0-9]+/;
 var REQUIRED_NODE_VERSION = /0.10.[0-9]+/;
 var SHRINKWRAP_MODULES_TO_VALIDATE = [
  'backbone',
  'camshaft-reference',
  'carto',
  'cartodb.js',
  'cartocolor',
  'd3',
  'jquery',
  'leaflet',
  'perfect-scrollbar',
  'torque.js',
  'turbo-carto'
];

  /**
   *  CartoDB UI assets generation
   */

  module.exports = function(grunt) {

    if (timer) timer.init(grunt);

    function preFlight(done) {
      function checkVersion(cmd, versionRegExp, name, done) {
        require("child_process").exec(cmd, function (error, stdout, stderr) {
          var err = null;
          if (error) {
            err = 'failed to check version for ' + name;
          } else {
            if (!versionRegExp.test(stdout)) {
              err = 'installed ' + name + ' version does not match with required one ' + versionRegExp.toString() + " installed: " +  stdout;
            }
          }
          if (err) {
            grunt.log.fail(err);
          }
          done && done(err ? new Error(err): null);
        });
      }
      checkVersion('npm -v', REQUIRED_NPM_VERSION, 'npm', done);
      checkVersion('node -v', REQUIRED_NODE_VERSION, 'node', done);
    }

    preFlight(function (err) {
      if (err) {
        grunt.log.fail("############### /!\\ CAUTION /!\\ #################");
        grunt.log.fail("PLEASE installed required versions to build CARTO:\n- npm: " + REQUIRED_NPM_VERSION + "\n- node: " + REQUIRED_NODE_VERSION);
        grunt.log.fail("#################################################");
        process.exit(1);
      }
    });

    var duplicatedModules = duplicatedDependencies(require('./npm-shrinkwrap.json'), SHRINKWRAP_MODULES_TO_VALIDATE);
    if (duplicatedModules.length > 0) {
      grunt.log.fail("############### /!\\ CAUTION /!\\ #################");
      grunt.log.fail("Duplicated dependencies found in npm-shrinkwrap.json file.");
      grunt.log.fail(JSON.stringify(duplicatedModules, null, 4));
      grunt.log.fail("#################################################");
      process.exit(1);
    }

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

      assets_dir: ASSETS_DIR,
      root_assets_dir: ROOT_ASSETS_DIR,

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

      jasmine:  jasmineCfg,

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
    require('load-grunt-tasks')(grunt, {
      pattern: ['grunt-*', '@*/grunt-*', '!grunt-timer']
    });

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
      var url = require('url');
      var https = require('https');

      var options = url.parse(grunt.template.process('https://api.fastly.com/service/<%= aws.FASTLY_CARTODB_SERVICE %>/purge_all'));
      options['method'] = 'POST';
      options['headers'] = {
        'Fastly-Key': aws.FASTLY_API_KEY,
        'Content-Length': '0' //Disables chunked encoding
      };
      console.log(options);

      https.request(options, function(response) {
        if(response.statusCode == 200) {
          grunt.log.ok('CDN invalidated (fastly)');
        } else {
          grunt.log.error('CDN not invalidated (fastly), code: ' + response.statusCode)
        }
        done();
      }).on('error', function(e) {
        grunt.log.error('CDN not invalidated (fastly)');
        done();
      }).end();
    });

    grunt.registerTask('config', "generates assets config for current configuration", function() {
      // Set assets url for static assets in our app
      var config = grunt.template.process("cdb.config.set('assets_url', '<%= env.http_path_prefix %>/assets/<%= pkg.version %>');");
      config += grunt.template.process("\nconsole.log('cartodbui v<%= pkg.version %>');");
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

      var COPY_PATHS = [
        'app',
        'js_core_cartodb3',
        'js_client_cartodb3',
        'js_test_spec_core_cartodb3',
        'js_test_spec_client_cartodb3',
        'js_test_jasmine_core_cartodb3',
        'js_test_jasmine_client_cartodb3'
      ];

      // configure copy paths to only run on changed files
      for (var j = 0, m = COPY_PATHS.length; j < m; ++j) {
        var copy_path = COPY_PATHS[j];
        var files = grunt.config.get('copy.' + copy_path + '.files');
        for (var i = 0, l = files.length; i < l; ++i) {
          var cfg = grunt.config.get('copy.' + copy_path + '.files.' + i);
          if (filepath.indexOf(cfg.cwd) !== -1) {
            grunt.config('copy.' + copy_path + '.files.' + i + '.src', filepath.replace(cfg.cwd, ''));
          } else {
            grunt.config('copy.' + copy_path + '.files.' + i + '.src', []);
          }
        }
      }
    });

    grunt.registerTask('setConfig', 'Set a config property', function(name, val) {
      grunt.config.set(name, val);
    });

    // still have to use this custom task because registerCmdTask outputs tons of warnings like:
    // path/to/some/ignored/files:0:0: File ignored because of your .eslintignore file. Use --no-ignore to override.
    grunt.registerTask('lint', 'lint source files', function () {
      var done = this.async();
      require('child_process').exec('(git diff --name-only --relative; git diff origin/master.. --name-only --relative) | grep \'\\.js\\?$\' | xargs node_modules/.bin/semistandard', function (error, stdout, stderr) {
        if (error) {
          grunt.log.fail(error);

          // Filter out lines that are ignored,
          // e.g. "src/foobar.js:0:0: File ignored because of your .eslintignore file. Use --no-ignore to override."
          grunt.log.fail(stdout.replace(/.+--no-ignore.+(\r?\n|\r)/g, ''));
          grunt.fail.warn('try `node_modules/.bin/semistandard --format src/filename.js` to auto-format code (you might still need to fix some things manually).');
        } else {
          grunt.log.ok('All linted files OK!');
          grunt.log.writelns('>> Note that files listed in .eslintignore are not linted');
        }
        done();
      });
    });

    registerCmdTask('npm-test', {cmd: 'npm', args: ['test']});
    registerCmdTask('npm-test-watch', {cmd: 'npm', args: ['run', 'test-watch']});

    grunt.registerTask('pre_client',  ['cdb', 'concat:js', 'jst', 'copy:locale_core', 'copy:locale_client', 'copy:js_core', 'copy:js_client', 'copy:js_tests_core', 'copy:js_tests_client']);
    grunt.registerTask('js',          ['cdb', 'pre_client', 'browserify', 'concat:js', 'jst']);
    grunt.registerTask('pre_default', ['clean', 'config', 'js']);
    grunt.registerTask('test', '(CI env) Re-build JS files and run all tests. ' +
    'For manual testing use `grunt jasmine` directly', ['pre_default', 'npm-test', 'jasmine', 'lint']);
    grunt.registerTask('editor3', ['browserify:vendor_editor3', 'browserify:common_editor3', 'browserify:editor3', 'browserify:public_editor3']);
    grunt.registerTask('css_editor_3', ['copy:cartofonts', 'copy:iconfont', 'copy:cartoassets', 'copy:perfect_scrollbar', 'copy:colorpicker', 'copy:deep_insights', 'copy:cartodbjs_v4']);
    grunt.registerTask('css',         ['copy:vendor', 'css_editor_3', 'copy:app', 'compass', 'concat:css']);
    grunt.registerTask('default',     ['pre_default', 'css', 'manifest']);
    grunt.registerTask('minimize',    ['default', 'copy:js', 'exorcise', 'uglify']);
    grunt.registerTask('release',     ['check_release', 'minimize', 's3', 'invalidate']);
    grunt.registerTask('build-jasmine-specrunners', _
      .chain(jasmineCfg)
      .keys()
      .map(function (name) {
        return ['jasmine', name, 'build'].join(':');
      })
      .value());
    grunt.registerTask('dev', 'Typical task for frontend development (watch JS/CSS changes)',
      ['setConfig:env.browserify_watch:true', 'browserify', 'build-jasmine-specrunners', 'connect', 'watch']);
    grunt.registerTask('sourcemaps', 'generate sourcemaps, to be used w/ trackjs.com for bughunting',
      ['setConfig:assets_dir:./tmp/sourcemaps', 'config', 'js', 'copy:js', 'exorcise', 'uglify']);

    /**
     * Delegate task to commandline.
     * @param {String} name - If taskname starts with npm it's run a npm script (i.e. `npm run foobar`
     * @param {Object} d - d as in data
     * @param {Array} d.args - arguments to pass to the d.cmd
     * @param {String} [d.cmd = process.execPath]
     * @param {String} [d.desc = ''] - description
     * @param {...string} args space-separated arguments passed to the cmd
     */
    function registerCmdTask (name, opts) {
      opts = _.extend({
        cmd: process.execPath,
        desc: '',
        args: []
      }, opts);
      grunt.registerTask(name, opts.desc, function () {
        // adapted from http://stackoverflow.com/a/24796749
        var done = this.async();
        grunt.util.spawn({
          cmd: opts.cmd,
          args: opts.args,
          opts: { stdio: 'inherit' }
        }, done);
      });
    }
  };
