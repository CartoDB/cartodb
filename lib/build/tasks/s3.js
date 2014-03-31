
module.exports = {
  task: function() {
    return {
     options: {
        accessKeyId: "<%= aws.key%>",
        secretAccessKey: "<%= aws.secret %>",
        bucket: '<%= aws.bucket %>',
     },
     js: {
        options: {
          headers: {
            "CacheControl": "max-age=630720000, public",
            "Expires": new Date(Date.now() + 63072000000).toUTCString()
          },
          gzip: true
        },
        cwd: '<%= assets_dir %>',
        src: ["**/*.js", "**/*.map"],
        dest: "cartodbui/<%= pkg.version %>/"
     },
     css: {
        options: {
          headers: {
            "CacheControl": "max-age=630720000, public",
            "Expires": new Date(Date.now() + 63072000000).toUTCString()
          },
          gzip: true
        },
        cwd: '<%= assets_dir %>',
        src: "**/*.css",
        dest: "cartodbui/<%= pkg.version %>/"
     },
     images: {
        options: {
          headers: {
            "CacheControl": "max-age=630720000, public",
            "Expires": new Date(Date.now() + 63072000000).toUTCString()
          }
        },
        cwd: '<%= assets_dir %>',
        src: "images/**/*",
        dest: "cartodbui/<%= pkg.version %>/"
      },
      manifest: {
        options: {
          headers: {
            "CacheControl": "private,no-cache"
          }
        },
        cwd: '<%= root_assets_dir %>',
        src: 'manifest.yml',
        dest: "cartodbui/"
      }
   }
  }
};
