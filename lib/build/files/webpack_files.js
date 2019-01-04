var files = {
  dashboard: {
    page: 'dashboard',
    stylesheets: [
      '/stylesheets/common_new.css',
      '/stylesheets/dashboard.css',
    ],
    scripts: [
      '/javascripts/common.js',
      '/javascripts/common_vendor.js',
      '/javascripts/dashboard.js'
    ],
    feature_flags: {
      'new-dashboard-feature': {
        stylesheets: [
          '/stylesheets/common_new.css',
          '/stylesheets/new_dashboard.css'
        ],
        scripts: [
          '/javascripts/common.js',
          '/javascripts/common_vendor.js',
          '/javascripts/new_dashboard.js'
        ]
      }
    }
  },
  profile: {
    page: 'profile',
    stylesheets: [
      '/stylesheets/common_new.css',
    ],
    scripts: [
      '/javascripts/common.js',
      '/javascripts/common_vendor.js',
      '/javascripts/profile.js'
    ]
  },
  // show: {
  //   stylesheets: [
  //     '/stylesheets/old_common_without_core.css',
  //     '/stylesheets/common.css',
  //     '/stylesheets/cdb.css',
  //     '/stylesheets/table.css',
  //     '/stylesheets/editor.css',
  //     '/stylesheets/map.css'
  //   ],
  //   scripts: [
  //     '/javascripts/cdb.js',
  //     '/javascripts/models.js',
  //     '/javascripts/carto_node.js',
  //     '/javascripts/templates_mustache.js',
  //     '/javascripts/show_templates_static.js',
  //     '/javascripts/show_deps_static.js',
  //     '/javascripts/show_static.js',
  //     '/javascripts/editor.js'
  //   ],
  //   favicons: [
  //     '/favicons/favicon.ico'
  //   ],
  //   visualization: {
  //     params: {
  //       show_permission: true,
  //       show_liked: true,
  //       show_stats: true,
  //       show_auth_tokens: true,
  //       show_user_basemaps: true,
  //       fetch_user: true,
  //       privacy: 'PUBLIC'
  //     }
  //   }
  // },
  // public_map: {
  //   stylesheets: [
  //     '/stylesheets/cartodb.css',
  //     '/stylesheets/common.css',
  //     '/stylesheets/public_map.css',
  //     '/stylesheets/password_protected.css'
  //   ],
  //   scripts: [
  //     '/javascripts/cdb.js',
  //     '/javascripts/models.js',
  //     '/javascripts/carto_node.js',
  //     '/javascripts/templates_mustache.js',
  //     '/javascripts/public_like.js',
  //     '/javascripts/public_map_templates_static.js',
  //     '/javascripts/public_map_deps_static.js',
  //     '/javascripts/public_map_static.js'
  //   ],
  //   images: [
  //     '/images/layout/carto_logo.svg'
  //   ],
  //   visualization: {
  //     params: {
  //       show_permission: true,
  //       show_liked: true,
  //       show_stats: true,
  //       fetch_user: true,
  //       fetch_related_canonical_visualizations: false
  //     }
  //   },
  //   vendor: {
  //     hubspot_form: true
  //   }
  // },
  // embed_map: {
  //   stylesheets: [
  //     '/stylesheets/cartodb.css',
  //     '/stylesheets/embed_map.css',
  //     '/stylesheets/password_protected.css'
  //   ],
  //   scripts: [
  //     '/javascripts/cdb.js',
  //     '/javascripts/models.js',
  //     '/javascripts/carto_node.js',
  //     '/javascripts/public_like.js',
  //     '/javascripts/embed_map_templates_static.js',
  //     '/javascripts/embed_map_static.js'
  //   ],
  //   images: [
  //     '/images/layout/carto_logo.svg'
  //   ],
  //   visualization: {
  //     params: {
  //       show_permission: true,
  //       show_liked: true,
  //       show_stats: true,
  //       fetch_user: true,
  //       fetch_related_canonical_visualizations: false
  //     }
  //   }
  // },
  account: {
    page: 'account',
    stylesheets: [
      '/stylesheets/common_new.css',
    ],
    scripts: [
      '/javascripts/common.js',
      '/javascripts/common_vendor.js',
      '/javascripts/account.js'
    ]
  }
};

module.exports = files;
