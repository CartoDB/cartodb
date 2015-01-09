// Only add bundles here that are expected to be used as entry point files (i.e. minimized and distributed on CDNs).
module.exports = {
  new_dashboard: {
    src: [
      '<%= browserify_modules.src %>/new_dashboard/entry.js'
    ]
  }
};

