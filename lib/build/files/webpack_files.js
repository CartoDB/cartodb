var files = {
  dashboard: {
    stylesheets: [
      '/stylesheets/cartodb.css',
      '/stylesheets/common.css',
      '/stylesheets/dashboard.css'
    ],
    scripts: [
      '/javascripts/cdb_static.js',
      '/javascripts/models_static.js',
      '/javascripts/carto_node.js',
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
      '/javascripts/cdb_static.js',
      '/javascripts/models_static.js',
      '/javascripts/carto_node.js',
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
      '/javascripts/cdb_static.js',
      '/javascripts/models_static.js',
      '/javascripts/carto_node.js',
      '/javascripts/account_templates.js',
      '/javascripts/account_deps.js',
      '/javascripts/account_static.js'
    ],
    google_api_active: true
  }
};

module.exports = files;
