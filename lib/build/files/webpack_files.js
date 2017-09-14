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
  embed_map: {
    stylesheets: [
      '/stylesheets/cartodb.css'
    ],
    scripts: [
      '/javascripts/cdb.js',
      '/javascripts/models.js',
      '/javascripts/public_like.js',
      '/javascripts/embed_templates.js',
      '/javascripts/embed_static.js'
    ]
  }
};

module.exports = files;
