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
  show: {
    stylesheets: [
      '/stylesheets/old_common_without_core.css',
      '/stylesheets/common.css',
      '/stylesheets/cdb.css',
      '/stylesheets/table.css',
      '/stylesheets/editor.css',
      '/stylesheets/map.css'
    ],
    scripts: [
      '/javascripts/cdb.js',
      '/javascripts/models.js',
      '/javascripts/show_templates_static.js',
      '/javascripts/templates_mustache.js',
      '/javascripts/show_deps_static.js',
      '/javascripts/show_static.js',
      '/javascripts/editor.js'
    ],
    favicons: [
      '/favicons/favicon.ico'
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
    ]
  }
};

module.exports = files;
