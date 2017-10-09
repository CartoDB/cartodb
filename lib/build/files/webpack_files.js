var files = {
  dashboard: {
    stylesheets: [
      '/stylesheets/cartodb.css',
      '/stylesheets/common.css',
      '/stylesheets/dashboard.css'
    ],
    scripts: [
      '/javascripts/cdb.js',
      '/javascripts/models.js',
      '/javascripts/dashboard_templates_static.js',
      '/javascripts/dashboard_deps_static.js',
      '/javascripts/dashboard_static.js'
    ]
  },
  public_map: {
    stylesheets: [
      '/stylesheets/cartodb.css',
      '/stylesheets/common.css',
      '/stylesheets/public/public_header.css',
      '/stylesheets/public_map.css'
    ],
    scripts: [
      '/javascripts/cdb.js',
      '/javascripts/models.js',
      '/javascripts/public_map_templates_static.js',
      '/javascripts/public_map_deps_static.js',
      '/javascripts/public_map_static.js'
    ],
    images: [
      '/images/layout/carto_logo.svg'
    ]
  }
};

module.exports = files;
