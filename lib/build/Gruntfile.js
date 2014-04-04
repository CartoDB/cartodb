
 require('shelljs/global');

  /**
   *  CartoDB UI assets generation
   */

  module.exports = function(grunt) {

    var ROOT_ASSETS_DIR = '../../public/assets/';
    var ASSETS_DIR = '../../public/assets/<%= pkg.version %>';

    // use grunt --environment production
    var env = grunt.option('environment') || 'development';

    var aws = {};
    if (grunt.file.exists('grunt-aws.json')) {
      aws = grunt.file.readJSON('grunt-aws.json');
    }

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      aws: aws,
      env: grunt.file.readJSON("./config/" + env + ".json"),
      gitrev: exec('git rev-parse HEAD', { silent:true }).output.replace('\n', ''),

      assets_dir: ASSETS_DIR,
      root_assets_dir: ROOT_ASSETS_DIR,

      // Concat task
      concat:   require('./tasks/concat').task(),

      // JST generation task
      jst:      require('./tasks/jst').task(),

      // Compass files generation
      compass:  require('./tasks/compass').task(),

      // Copy assets (stylesheets, javascripts, images...)
      copy:     require('./tasks/copy').task(grunt),

      // Watch actions
      watch: require('./tasks/watch.js').task(),

      // Clean folders before other tasks
      clean:    require('./tasks/clean').task(),

      // Jasmine tests
      jasmine:  require('./tasks/jasmine.js').task(),

      s3: require('./tasks/s3.js').task(),

      uglify: require('./tasks/uglify.js').task()


    });

    // Load Grunt tasks
    require('load-grunt-tasks')(grunt);

    require('./tasks/manifest').register(grunt, ASSETS_DIR);

    // builds cdb
    grunt.registerTask('cdb', "builds cartodb.js", function() {
      var done = this.async();
      require("child_process").exec('cd ../../ && make update_cdb', function (error, stdout, stderr) {
        if (error) {
          grunt.log.fail('cartodb.js not updated');
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
      grunt.file.write("app_config.js", config);
    });

    grunt.registerTask('test',    ['config', 'concat:js', 'jst', 'jasmine']);
    grunt.registerTask('css',     ['copy:vendor', 'copy:app', 'compass', 'concat:css']);
    grunt.registerTask('default', ['clean', 'config', 'cdb', 'concat:js', 'css', 'jst', 'manifest']);
    grunt.registerTask('minimize',  ['default', 'copy:js', 'uglify']);
    grunt.registerTask('release',  ['default', 'copy:js', 'uglify', 's3', 'invalidate']);

  };
