var files = {
  dashboard: {
    page: 'dashboard',
    stylesheets: [
      '/stylesheets/common_new.css',
      '/stylesheets/new_dashboard.css'
    ],
    scripts: [
      '/javascripts/common.js',
      '/javascripts/common_vendor.js',
      '/javascripts/new_dashboard.js'
    ]
  },
  tilesets_viewer: {
    page: 'tilesets_viewer',
    anonymous: true,
    stylesheets: [
      '/stylesheets/common_new.css',
      '/stylesheets/tilesets_viewer.css'
    ],
    scripts: [
      '/javascripts/common.js',
      '/javascripts/common_vendor.js',
      '/javascripts/tilesets_viewer.js'
    ]
  },
  profile: {
    page: 'profile',
    stylesheets: [
      '/stylesheets/common_new.css',
      '/stylesheets/header.css',
      '/stylesheets/footer.css'
    ],
    scripts: [
      '/javascripts/header.js',
      '/javascripts/footer.js',
      '/javascripts/common.js',
      '/javascripts/common_vendor.js',
      '/javascripts/profile.js'
    ]
  },
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
      '/stylesheets/header.css',
      '/stylesheets/footer.css',
      '/stylesheets/common_new.css'
    ],
    scripts: [
      '/javascripts/header.js',
      '/javascripts/footer.js',
      '/javascripts/common.js',
      '/javascripts/common_vendor.js',
      '/javascripts/account.js'
    ]
  }
};

var path = require('path');
var fs = require('fs');

var gearEntryPoints = {};

[
  path.join(__dirname, '../../../gears'),
  path.join(__dirname, '../../../private_gears')
].forEach((gearsDir) => {
  if (fs.existsSync(gearsDir)) {
    fs.readdirSync(gearsDir).forEach((gearName) => {
      // Find HtmlWebpackPlugin extensions and overrides
      let gearWebpackFilesPath = path.join(gearsDir, gearName, 'webpack/static-pages/webpack_files.js');
      if (fs.existsSync(gearWebpackFilesPath)) {
        let gearWebpackFiles = require(gearWebpackFilesPath);

        if (gearWebpackFiles.htmlFiles) {
          console.info(`> Found HtmlWebpackPlugin extension for gear ${gearName} in ${gearWebpackFilesPath}`);

          Object.entries(gearWebpackFiles.htmlFiles).forEach(([entryName, config]) => {
            if (!files[entryName]) {
              console.info(`>   ┕╸ Added entryName "${entryName}"`);
              files[entryName] = {};
            } else {
              console.info(`>   ┕╸ Extended entryName "${entryName}"`);
            }

            Object.entries(config).forEach(([confName, val]) => {
              if (files[entryName][confName] instanceof Array && val instanceof Array) {
                files[entryName][confName].push(...val);
              } else {
                files[entryName][confName] = val;
              }
            });
          });
        }
        // Find entry point overrides

        if (gearWebpackFiles.entryPoints) {
          console.info(`> Found entry points for gear ${gearName} in ${gearWebpackFilesPath}`);

          Object.entries(gearWebpackFiles.entryPoints).forEach(([entryName, entryPath]) => {
            entryPath = path.resolve(gearsDir, gearName, 'lib/build/files/', entryPath);
            gearEntryPoints[entryName] = entryPath;
            console.info(`>   ┕╸ Added entry "${entryName}" at ${entryPath}`);
          });
        }
      }
    });
  }
});

module.exports = {
  'htmlFiles': files,
  'gearEntryPoints': gearEntryPoints
};
