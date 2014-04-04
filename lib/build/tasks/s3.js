
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
        dest: "cartodbui/assets/<%= pkg.version %>/"
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
        dest: "cartodbui/assets/<%= pkg.version %>/"
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
        dest: "cartodbui/assets/<%= pkg.version %>/"
     },

     fonts: {
        options: {
          headers: {
            "CacheControl": "max-age=630720000, public",
            "Expires": new Date(Date.now() + 63072000000).toUTCString()
          }
        },
        cwd: '<%= assets_dir %>',
        src: "fonts/**/*",
        dest: "cartodbui/assets/<%= pkg.version %>/"
      },


     flash: {
        options: {
          headers: {
            "CacheControl": "max-age=630720000, public",
            "Expires": new Date(Date.now() + 63072000000).toUTCString()
          }
        },
        cwd: '<%= assets_dir %>',
        src: "flash/**/*",
        dest: "cartodbui/assets/<%= pkg.version %>/"
      },

      favicons: {
        options: {
          headers: {
            "CacheControl": "max-age=630720000, public",
            "Expires": new Date(Date.now() + 63072000000).toUTCString()
          }
        },
        cwd: '<%= assets_dir %>',
        src: "favicons/**/*",
        dest: "cartodbui/assets/<%= pkg.version %>/"
      },


      manifest: {
        options: {
          headers: {
            "CacheControl": "private,no-cache"
          },
          gzip: false
        },
        src: '<%= root_assets_dir %>/manifest.yml',
        dest: "cartodbui/manifest_<%= gitrev %>.yml"
      }
   }
  }
};
