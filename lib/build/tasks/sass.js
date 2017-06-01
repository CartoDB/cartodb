/**
 *  Compass task config
 */

exports.task = function () {
  return {
    options: {
      sourceMap: true,
      sourceMapEmbed: false,
      sourceMapContents: true,
      includePaths: [
        'node_modules/cartoassets/src/scss'
      ]
    },
    dist: {
      files: [{
        expand: true,
        cwd: 'tmp/sass/',
        src: [
          '**/*.scss',
          '!editor-3/**/*',
          '!editor/**/*'
        ],
        dest: '<%= assets_dir %>/stylesheets',
        ext: '.css'
      }, {
        '<%= assets_dir %>/stylesheets/editor3.css': ['tmp/sass/editor-3/entry.scss']
      }]
    }
  };
};
