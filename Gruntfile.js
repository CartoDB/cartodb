var _ = require('underscore');
var timer = require("grunt-timer");
var colors = require('colors');
var semver = require('semver');
var jasmineCfg = require('./lib/build/tasks/jasmine.js');
var shrinkwrapDependencies = require('./lib/build/tasks/shrinkwrap-dependencies.js');
var webpackTask = null;

var REQUIRED_NODE_VERSION = '6.9.2';
var REQUIRED_NPM_VERSION = '3.10.9';

var DEVELOPMENT = 'development';

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

function requireWebpackTask () {
  if (webpackTask === null) {
    webpackTask = require('./lib/build/tasks/webpack/webpack.js');
  }
  return webpackTask;
}

function logVersionsError (err, requiredNodeVersion, requiredNpmVersion) {
  if (err) {
    grunt.log.fail("############### /!\\ CAUTION /!\\ #################");
    grunt.log.fail("PLEASE installed required versions to build CARTO:\n- node: " + requiredNodeVersion + "\n- node: " + requiredNpmVersion);
    grunt.log.fail("#################################################");
    process.exit(1);
  }
}

function isRunningTask (taskName, grunt) {
  return grunt.cli.tasks.indexOf(taskName) > -1;
}

/**
 *  CartoDB UI assets generation
 */

module.exports = function(grunt) {

    if (timer) timer.init(grunt);

    var environment = grunt.option('environment') || DEVELOPMENT;
    grunt.log.writeln('Environment: ' + environment);

    var runningTasks = grunt.cli.tasks;
    if (runningTasks.length === 0) {
      grunt.log.writeln('Running default task.'); 
    } else {
      grunt.log.writeln('Running tasks: ' + runningTasks);
    }

    function preFlight(requiredNodeVersion, requiredNpmVersion, logFn) {
      function checkVersion(cmd, versionRange, name, logFn) {
        grunt.log.writeln('Required ' + name + ' version: ' + versionRange);
        require("child_process").exec(cmd, function (error, stdout, stderr) {
          var err = null;
          if (error) {
            err = 'failed to check version for ' + name;
          } else {
            var installed = semver.clean(stdout);
            if (!semver.satisfies(installed, versionRange)) {
              err = 'Installed ' + name + ' version does not match with required [' + versionRange + "] Installed: " +  installed;
            }
          }
          if (err) {
            grunt.log.fail(err);
          }
          logFn && logFn(err ? new Error(err): null);
        });
      }
      checkVersion('node -v', requiredNodeVersion, 'node', logFn);
      checkVersion('npm -v', requiredNpmVersion, 'npm', logFn);
    }

    var mustCheckNodeVersion = grunt.option('no-node-checker');
    if (!mustCheckNodeVersion) {
      preFlight(REQUIRED_NODE_VERSION, REQUIRED_NPM_VERSION, logVersionsError);
      grunt.log.writeln('');
    }

    var duplicatedModules = shrinkwrapDependencies.checkDuplicatedDependencies(require('./npm-shrinkwrap.json'), SHRINKWRAP_MODULES_TO_VALIDATE);
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
    var env = './config/grunt_' + environment + '.json';
    grunt.log.writeln('env: ' + env);
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
      concat: require('./lib/build/tasks/concat').task(),

      // JST generation task
      jst: require('./lib/build/tasks/jst').task(),

      // Compass files generation
      compass: require('./lib/build/tasks/compass').task(),

      // Copy assets (stylesheets, javascripts, images...)
      copy: require('./lib/build/tasks/copy').task(grunt),

      // Watch actions
      watch: require('./lib/build/tasks/watch.js').task(),

      // Clean folders before other tasks
      clean: require('./lib/build/tasks/clean').task(),

      jasmine: jasmineCfg,

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
      if (environment === DEVELOPMENT) {
        grunt.log.error("you can't release running development environment");
        return false;
      }
      grunt.log.ok("************************************************");
      grunt.log.ok(" you are going to deploy to " + env );
      grunt.log.ok("************************************************");
    });

    grunt.event.on('watch', function(action, filepath, subtask) {
      // configure copy vendor to only run on changed file
      var cfg = grunt.config.get('copy.vendor');
      if (filepath.indexOf(cfg.cwd) !== -1) {
        grunt.config('copy.vendor.src', filepath.replace(cfg.cwd, ''));
      } else {
        grunt.config('copy.vendor.src', []);
      }

      var builderFiles = [
        'js_core_cartodb3',
        'js_client_cartodb3',
        'js_test_spec_core_cartodb3',
        'js_test_spec_client_cartodb3'
      ];
      var otherFiles = [
        'app',
        'js_core_cartodb',
        'js_client_cartodb',
        'js_test_jasmine_core_cartodb3',
        'js_test_jasmine_client_cartodb3'
      ];

      var COPY_PATHS = [];
      if (subtask === 'js_affected') {
        COPY_PATHS = COPY_PATHS.concat(builderFiles);
      } else {
        COPY_PATHS = COPY_PATHS.concat(otherFiles).concat(builderFiles);
      }

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

    grunt.registerTask('pre_client', [
      'copy:locale_core',
      'copy:locale_client',
      'copy:js_core_cartodb',
      'copy:js_client_cartodb',
      'copy:js_core_cartodb3',
      'copy:js_client_cartodb3',
      'copy:js_test_spec_core_cartodb3',
      'copy:js_test_spec_client_cartodb3',
      'copy:js_test_jasmine_core_cartodb3',
      'copy:js_test_jasmine_client_cartodb3'
    ]);

    grunt.registerTask('js', ['cdb', 'pre_client', 'run_browserify', 'concat:js', 'jst']);
    grunt.registerTask('pre_default', ['clean', 'config', 'js']);
    grunt.registerTask('test', '(CI env) Re-build JS files and run all tests. For manual testing use `grunt jasmine` directly', [
        'pre_default',
        'jasmine:cartodbui',
        'jasmine:cartodb3',
        'lint'
      ]);
    grunt.registerTask('editor3', [
      'browserify:vendor_editor3',
      'browserify:common_editor3',
      'browserify:editor3',
      'browserify:public_editor3'
    ]);
    grunt.registerTask('css_editor_3', [
      'copy:cartofonts',
      'copy:iconfont',
      'copy:cartoassets',
      'copy:perfect_scrollbar',
      'copy:colorpicker',
      'copy:deep_insights',
      'copy:cartodbjs_v4'
    ]);
    grunt.registerTask('css', ['copy:vendor', 'css_editor_3', 'copy:app', 'compass', 'concat:css']);
    grunt.registerTask('default', ['pre_default', 'css', 'manifest']);
    grunt.registerTask('minimize', ['default', 'copy:js', 'exorcise', 'uglify']);
    grunt.registerTask('release', ['check_release', 'minimize', 's3', 'invalidate']);
    grunt.registerTask('build-jasmine-specrunners', _
      .chain(jasmineCfg)
      .keys()
      .map(function (name) {
        return ['jasmine', name, 'build'].join(':');
      })
      .value());
    grunt.registerTask('dev', 'Typical task for frontend development (watch JS/CSS changes)', [
      'setConfig:env.browserify_watch:true',
      'run_browserify',
      'build-jasmine-specrunners',
      'connect:server',
      'run_watch:builder_specs=false']);

    grunt.registerTask('sourcemaps',
      'generate sourcemaps, to be used w/ trackjs.com for bughunting', [
        'setConfig:assets_dir:./tmp/sourcemaps',
        'config',
        'js',
        'copy:js',
        'exorcise',
        'uglify'
      ]);

    grunt.registerTask('run_watch', 'All watch tasks except those that watch spec changes', function (option) {
      if (option === 'builder_specs=false') {
        delete grunt.config.data.watch.js_test_spec_core_cartodb3;
        delete grunt.config.data.watch.js_test_spec_client_cartodb3;
        delete grunt.config.data.watch.js_test_jasmine_core_cartodb3;
        delete grunt.config.data.watch.js_test_jasmine_client_cartodb3;
        delete grunt.config.data.watch.js_affected;
      }
      grunt.task.run('watch');
    });

    grunt.registerTask('run_browserify', 'Browserify task with options', function (option) {
      var skipAllSpecs = false;
      var skipBuilderSpecs = false;

      if (environment !== DEVELOPMENT) {
        grunt.log.writeln('Skipping all specs generation by browserify because not in development environment.');
        skipAllSpecs = true;
      } else if (!isRunningTask('test', grunt)) {
        grunt.log.writeln('Skipping only Builder specs generation by browserify because we are not running the `test` task.');
        skipBuilderSpecs = true;
      }

      if (skipAllSpecs) {
        delete grunt.config.data.browserify['test_specs_for_browserify_modules'];
        delete grunt.config.data.browserify['cartodb3-specs'];
      } else if (skipBuilderSpecs) {
        delete grunt.config.data.browserify['cartodb3-specs'];
      }

      grunt.task.run('browserify');
    });

    grunt.registerTask('copy_builder', 'Multitask with all the tasks responsible for copying builder files.', [
     'copy:locale_core',
     'copy:locale_client',
     'copy:js_core_cartodb3',
     'copy:js_client_cartodb3',
     'copy:js_test_spec_core_cartodb3',
     'copy:js_test_spec_client_cartodb3'
    ]);

    // Affected specs section - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    grunt.registerTask('affected', 'Generate only affected specs', function () {
      requireWebpackTask().affected.call(this, grunt);
    });

    grunt.registerTask('bootstrap_webpack_builder_specs', 'Create the webpack compiler', function () {
      requireWebpackTask().bootstrap.call(this, 'builder_specs', grunt);
    });

    grunt.registerTask('webpack:builder_specs', 'Webpack compilation task for builder specs', function () {
      requireWebpackTask().compile.call(this, 'builder_specs');
    });

    /**
     * `grunt affected_specs` compile Builder specs using only affected ones by the current branch.
     * `grunt affected_specs --specs=all` compile all Builder specs.
     */
    grunt.registerTask('affected_specs', 'Build only specs affected by changes in current branch', [
      'copy_builder',
      'affected',
      'bootstrap_webpack_builder_specs',
      'webpack:builder_specs',
      'jasmine:affected:build',
      'connect:specs',
      'watch:js_affected'
    ]);

    // / Affected specs section - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
