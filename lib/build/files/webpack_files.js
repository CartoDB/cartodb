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
  profile: {
    stylesheets: [
      '/stylesheets/cartodb.css',
      '/stylesheets/common.css'
    ],
    scripts: [
      '/javascripts/cdb.js',
      '/javascripts/models.js',
      '/javascripts/profile_templates.js',
      '/javascripts/account_deps.js',
      '/javascripts/profile_static.js'
    ]
  },
  account: {
    stylesheets: [
      '/stylesheets/cartodb.css',
      '/stylesheets/common.css'
    ],
    scripts: [
      '/javascripts/cdb.js',
      '/javascripts/models.js',
      '/javascripts/account_templates.js',
      '/javascripts/account_deps.js',
      '/javascripts/account_static.js'
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
      '/javascripts/public_map_deps_static.js',
      '/javascripts/public_templates.js',
      '/javascripts/public_map_templates_static.js',
      '/javascripts/public_map_static.js'
    ],
    images: [
      '/images/layout/carto_logo.svg'
    ]
  }
};

module.exports = files;
