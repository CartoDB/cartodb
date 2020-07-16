var _ = require('underscore');
var timer = require('grunt-timer');
var semver = require('semver');
var jasmineCfg = require('./lib/build/tasks/jasmine.js');
var execSync = require('child_process').execSync;
var lockedDependencies = require('./lib/build/tasks/locked-dependencies.js');
var webpackTask = null;
var EDITOR_ASSETS_VERSION = require('./config/editor_assets_version.json').version;

var REQUIRED_NODE_VERSIONS = ['10.x', '12.x'];
var REQUIRED_NPM_VERSIONS = ['6.x'];

var DEVELOPMENT = 'development';

var LOCKED_MODULES_TO_VALIDATE = [
  'backbone',
  'camshaft-reference',
  'carto',
  'internal-carto.js',
  'cartocolor',
  'd3',
  'jquery',
  'leaflet',
  'perfect-scrollbar',
  'torque.js',
  'turbo-carto'
];

// Synchronously check if editor assets have changed
var diff = execSync('git diff --numstat $(git rev-list --tags --skip=1  --max-count=1) -- $(git symbolic-ref --short HEAD) config/editor_assets_version.json', {
  cwd: __dirname
});
var EDITOR_ASSETS_CHANGED = diff.toString().length > 0;

function requireWebpackTask () {
  if (webpackTask === null) {
    webpackTask = require('./lib/build/tasks/webpack/webpack.js');
  }
  return webpackTask;
}

function logVersionsError (err, requiredNodeVersions, requiredNpmVersions) {
  if (err) {
    grunt.log.fail('############### /!\\ CAUTION /!\\ #################');
    grunt.log.fail('PLEASE installed required versions to build CARTO:\n- node: ' + requiredNodeVersions.join(', ') + '\n- npm: ' + requiredNpmVersions.join(', '));
    grunt.log.fail('#################################################');
    process.exit(1);
  }
}

function getTargetDiff () {
  var target = require('child_process').execSync('(git diff --name-only --relative || true;' +
                                                 'git diff origin/master.. --name-only --relative || true;)' +
                                                 '| grep \'\\.js\\?$\' || true').toString();
  if (target.length === 0) {
    target = ['.'];
  } else {
    target = target.split('\n');
    target.splice(-1, 1);
  }
  return target;
}

/**
 *  CartoDB UI assets generation
 */
module.exports = function (grunt) {
  if (timer) timer.init(grunt);

  var environment = grunt.option('environment') || DEVELOPMENT;
  grunt.log.writeln('Environment: ' + environment);

  var runningTasks = grunt.cli.tasks;
  if (runningTasks.length === 0) {
    grunt.log.writeln('Running default task.');
  } else {
    grunt.log.writeln('Running tasks: ' + runningTasks);
  }

  function preFlight (requiredNodeVersions, requiredNpmVersions, logFn) {
    function checkVersion (cmd, versionRange, name, logFn) {
      grunt.log.writeln('Required ' + name + ' version: ' + versionRange.join(', '));
      require('child_process').exec(cmd, function (error, stdout, stderr) {
        var err = null;
        if (error) {
          err = 'failed to check version for ' + name;
        } else {
          var installed = semver.clean(stdout);
          if (!semver.satisfies(installed, versionRange.join(' || '))) {
            err = 'Installed ' + name + ' version does not match with required [' + versionRange.join(', ') + '] Installed: ' + installed;
          }
        }
        if (err) {
          grunt.log.fail(err);
        }
        logFn && logFn(err ? new Error(err) : null);
      });
    }
    checkVersion('node -v', requiredNodeVersions, 'node', logFn);
    checkVersion('npm -v', requiredNpmVersions, 'npm', logFn);
  }

  var mustCheckNodeVersion = grunt.option('no-node-checker');
  if (!mustCheckNodeVersion) {
    preFlight(REQUIRED_NODE_VERSIONS, REQUIRED_NPM_VERSIONS, logVersionsError);
    grunt.log.writeln('');
  }

  var duplicatedModules = lockedDependencies.checkDuplicatedDependencies(require('./package-lock.json'), LOCKED_MODULES_TO_VALIDATE);
  if (duplicatedModules.length > 0) {
    grunt.log.fail('############### /!\\ CAUTION /!\\ #################');
    grunt.log.fail('Duplicated dependencies found in package-lock.json file.');
    grunt.log.fail(JSON.stringify(duplicatedModules, null, 4));
    grunt.log.fail('#################################################');
    process.exit(1);
  }

  var PUBLIC_DIR = './public/';
  var ROOT_ASSETS_DIR = './public/assets/';
  var ASSETS_DIR = './public/assets/<%= pkg.version %>';
  var EDITOR_ASSETS_DIR = `./public/assets/editor/${EDITOR_ASSETS_VERSION}`;

  /**
   * this is being used by `grunt --environment=production release`
   */
  var env = './config/grunt_' + environment + '.json';
  grunt.log.writeln('env: ' + env);

  if (grunt.file.exists(env)) {
    env = grunt.file.readJSON(env);
  } else {
    throw grunt.util.error(env + ' file is missing! See ' + env + '.sample for how it should look like');
  }

  var aws = {};
  if (grunt.file.exists('./lib/build/grunt-aws.json')) {
    aws = grunt.file.readJSON('./lib/build/grunt-aws.json');
  }

  var targetDiff = getTargetDiff();

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    aws: aws,
    env: env,

    public_dir: PUBLIC_DIR,
    assets_dir: ASSETS_DIR,
    editor_assets_dir: EDITOR_ASSETS_DIR,
    editor_assets_version: EDITOR_ASSETS_VERSION,
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

    // Create a tarball of the static pages for production release
    compress: require('./lib/build/tasks/compress.js').task(),

    s3: require('./lib/build/tasks/s3.js').task(),

    exorcise: require('./lib/build/tasks/exorcise.js').task(),

    uglify: require('./lib/build/tasks/uglify.js').task(),

    browserify: require('./lib/build/tasks/browserify.js').task(),

    connect: require('./lib/build/tasks/connect.js').task(),

    availabletasks: require('./lib/build/tasks/availabletasks.js').task(),

    sass: require('./lib/build/tasks/sass.js').task(),

    eslint: {
      target: targetDiff
    }
  });

  /**
   * `grunt availabletasks`
   */
  grunt.loadNpmTasks('grunt-available-tasks');

  // Load Grunt tasks
  require('load-grunt-tasks')(grunt, {
    pattern: ['grunt-*', '@*/grunt-*', '!grunt-timer']
  });

  require('./lib/build/tasks/manifest').register(grunt, ASSETS_DIR);

  grunt.registerTask('invalidate', 'invalidate cache', function () {
    var done = this.async();
    var url = require('url');
    var https = require('https');

    var options = url.parse(grunt.template.process('https://api.fastly.com/service/<%= aws.FASTLY_CARTODB_SERVICE %>/purge_all'));
    options['method'] = 'POST';
    options['headers'] = {
      'Fastly-Key': aws.FASTLY_API_KEY,
      'Content-Length': '0' // Disables chunked encoding
    };
    console.log(options);

    https.request(options, function (response) {
      if (response.statusCode === 200) {
        grunt.log.ok('CDN invalidated (fastly)');
      } else {
        grunt.log.error('CDN not invalidated (fastly), code: ' + response.statusCode);
      }
      done();
    }).on('error', function () {
      grunt.log.error('CDN not invalidated (fastly)');
      done();
    }).end();
  });

  grunt.registerTask('config', 'generates assets config for current configuration', function () {
    // Set assets url for static assets in our app
    var config = grunt.template.process('cdb.config.set(\'assets_url\', \'<%= env.http_path_prefix %>/assets/<%= pkg.version %>\');');
    config += grunt.template.process('\nconsole.log(\'cartodbui v<%= pkg.version %>\');');
    grunt.file.write('lib/build/app_config.js', config);
  });

  grunt.registerTask('check_release', 'checks release can be done', function () {
    if (environment === DEVELOPMENT) {
      grunt.log.error('you can\'t release running development environment');
      return false;
    }

    grunt.log.ok('************************************************');
    grunt.log.ok(' you are going to deploy to ' + env);
    grunt.log.ok('************************************************');
  });

  grunt.event.on('watch', function (action, filepath, subtask) {
    // Configure copy vendor to only run on changed file
    var vendorFile = 'copy.vendor';
    var vendorFileCfg = grunt.config.get(vendorFile);

    if (filepath.indexOf(vendorFileCfg.cwd) !== -1) {
      grunt.config(vendorFile + '.src', filepath.replace(vendorFileCfg.cwd, ''));
    } else {
      grunt.config(vendorFile + 'src', []);
    }

    // Configure copy app to only run on changed files
    var files = 'copy.app.files';
    var filesCfg = grunt.config.get(files);

    for (var i = 0, l = filesCfg.length; i < l; ++i) {
      var file = files + '.' + i;
      var fileCfg = grunt.config.get(file);

      if (filepath.indexOf(fileCfg.cwd) !== -1) {
        grunt.config(file + '.src', filepath.replace(fileCfg.cwd, ''));
      } else {
        grunt.config(file + '.src', []);
      }
    }
  });

  grunt.registerTask('css', [
    'copy:vendor',
    'copy:app',
    'copy:css_cartodb',
    'compass',
    'sass',
    'concat:css'
  ]);

  grunt.registerTask('run_browserify', 'Browserify task with options', function (option) {
    var skipAllSpecs = false;

    if (environment !== DEVELOPMENT) {
      grunt.log.writeln('Skipping all specs generation by browserify because not in development environment.');
      skipAllSpecs = true;
    }

    if (skipAllSpecs) {
      delete grunt.config.data.browserify['test_specs_for_browserify_modules'];
    }

    grunt.task.run('browserify');
  });

  grunt.registerTask('cdb', 'build cartodb.js', function () {
    var done = this.async();

    require('child_process').exec('make update_cdb', function (error, stdout, stderr) {
      if (error) {
        grunt.log.fail('cartodb.js not updated (due to ' + stdout + ', ' + stderr + ')');
      } else {
        grunt.log.ok('cartodb.js updated');
      }
      done();
    });
  });

  grunt.registerTask('js_editor', [
    'cdb',
    'setConfig:env.browserify_watch:true',
    'npm-carto-node',
    'run_browserify',
    'concat:js',
    'jst'
  ]);

  grunt.registerTask('beforeDefault', [
    'config'
  ]);

  grunt.registerTask('dev-editor', [
    'beforeDefault',
    'js_editor',
    'css',
    'manifest'
  ]);

  grunt.registerTask('editor-cdb', [
    'editor',
    'watch:cdb'
  ]);

  registerCmdTask('npm-start', {cmd: 'npm', args: ['run', 'start']});
  registerCmdTask('npm-build', {cmd: 'npm', args: ['run', 'build']});
  registerCmdTask('npm-build-static', {cmd: 'npm', args: ['run', 'build:static']});
  registerCmdTask('npm-carto-node', {cmd: 'npm', args: ['run', 'carto-node']});
  registerCmdTask('npm-build-dev', {cmd: 'npm', args: ['run', 'build:dev']});

  /**
   * `grunt dev`
   */

  grunt.registerTask('editor', [
    'build-static',
    'npm-build-dev',
    'dev-editor',
    'watch:css'
  ]);

  grunt.registerTask('default', [
    'build-static',
    'npm-build-dev',
    'dev-editor'
  ]);

  grunt.registerTask('lint', [
    'eslint'
  ]);

  grunt.registerTask('sourcemaps', 'generate sourcemaps, to be used w/ trackjs.com for bughunting', [
    'setConfig:assets_dir:./tmp/sourcemaps',
    'config',
    'js',
    'copy:js',
    'exorcise',
    'uglify'
  ]);

  // -- BUILD TASKS

  grunt.registerTask('build', 'build editor, builder, dashboard and static pages', [
    'build-editor',
    'build-static',
    'npm-build'
  ]);

  grunt.registerTask('build-editor', 'generate editor css and javasript files', [
    'dev-editor',
    'copy:js',
    'exorcise',
    'uglify'
  ]);

  grunt.registerTask('build-static', 'generate static files and needed vendor scripts', [
    'npm-carto-node',
    'npm-build-static'
  ]);

  /**
   * `grunt release`
   * `grunt release --environment=production`
   */
  grunt.registerTask('release', [
    'check_release',
    'build-static',
    'npm-build',
    'compress',
    's3:js',
    's3:css',
    's3:images',
    's3:fonts',
    's3:flash',
    's3:favicons',
    's3:unversioned',
    's3:unversioned_onboarding',
    's3:static_pages',
    'invalidate'
  ]);

  grunt.registerTask('release_editor_assets', 'builds & uploads editor assets', [
    'build-editor',
    's3:frozen',
    'invalidate'
  ]);

  grunt.registerTask('generate_builder_specs', 'Generate only builder specs', function (option) {
    requireWebpackTask().affected.call(this, option, grunt);
  });

  grunt.registerTask('generate_dashboard_specs', 'Generate only dashboard specs', function (option) {
    requireWebpackTask().dashboard.call(this, option, grunt);
  });

  grunt.registerTask('bootstrap_webpack_builder_specs', 'Create the webpack compiler', function () {
    requireWebpackTask().bootstrap.call(this, 'builder_specs', grunt);
  });

  grunt.registerTask('bootstrap_webpack_dashboard_specs', 'Create the webpack compiler', function () {
    requireWebpackTask().bootstrap.call(this, 'dashboard_specs', grunt);
  });

  grunt.registerTask('webpack:builder_specs', 'Webpack compilation task for builder specs', function () {
    requireWebpackTask().compile.call(this, 'builder_specs');
  });

  grunt.registerTask('webpack:dashboard_specs', 'Webpack compilation task for dashboard specs', function () {
    requireWebpackTask().compile.call(this, 'dashboard_specs');
  });

  var testTasks = [
    'connect:test',
    'beforeDefault',
    'generate_builder_specs',
    'bootstrap_webpack_builder_specs',
    'webpack:builder_specs',
    'jasmine:builder',
    'generate_dashboard_specs',
    'bootstrap_webpack_dashboard_specs',
    'webpack:dashboard_specs',
    'jasmine:dashboard',
    'lint'
  ];

  // If the editor assets version has changed, add the editor tests
  if (EDITOR_ASSETS_CHANGED) {
    testTasks.splice(testTasks.indexOf('generate_builder_specs'), 0, 'js_editor', 'jasmine:cartodbui');
  }

  /**
   * `grunt test`
   */
  grunt.registerTask('test', '(CI env) Re-build JS files and run all tests. For manual testing use `grunt jasmine` directly', testTasks);

  /**
   * `grunt test:browser` compile all Builder specs and launch a webpage in the browser.
   */
  grunt.registerTask('test:browser:builder', 'Build all Builder specs', [
    'generate_builder_specs',
    'bootstrap_webpack_builder_specs',
    'webpack:builder_specs',
    'jasmine:builder:build',
    'connect:specs_builder',
    'watch:js_affected'
  ]);

  /**
   * `grunt dashboard_specs` compile dashboard specs
   */
  grunt.registerTask('test:browser:dashboard', 'Build only dashboard specs', [
    'generate_dashboard_specs',
    'bootstrap_webpack_dashboard_specs',
    'webpack:dashboard_specs',
    'jasmine:dashboard:build',
    'connect:specs_dashboard',
    'watch:dashboard_specs'
  ]);

  grunt.registerTask('setConfig', 'Set a config property', function (name, val) {
    grunt.config.set(name, val);
  });

  /**
   * `grunt affected_editor_specs` compile all Editor specs and launch a webpage in the browser.
   */
  grunt.registerTask('affected_editor_specs', 'Build Editor specs', [
    'jasmine:cartodbui:build',
    'connect:server',
    'watch:js_affected_editor'
  ]);

  /**
   * Delegate task to command line.
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
