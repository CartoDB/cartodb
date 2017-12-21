module.exports = {
  'themes-img': {
    options: {
      progressive: true
    },
    files: [{
      expand: true,
      cwd: 'themes/img',
      src: [ '**/*.{png,jpg,gif,svg}' ],
      dest: '<%= config.dist %>/themes/img'
    }, {
      expand: true,
      cwd: 'node_modules/cartodb.js/themes/img',
      src: [ '**/*.{png,jpg,gif,svg}' ],
      dest: '<%= config.dist %>/themes/img'
    }]
  }
}
