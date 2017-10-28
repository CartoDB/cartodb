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
      '/javascripts/profile_templates.js',
      '/javascripts/account_deps.js',
      '/javascripts/profile_static.js'
    ]
  },
  password_protected: {
    stylesheets: [
      '/stylesheets/password_protected.css'
    ],
    scripts: [
      '/javascripts/cdb_static.js',
      '/javascripts/models_static.js',
      '/javascripts/password_protected_templates_static.js',
      '/javascripts/password_protected_static.js'
    ]
  }
};

module.exports = files;
