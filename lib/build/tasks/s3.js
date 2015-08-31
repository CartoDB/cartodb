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
        src: [
          "javascripts/*.js",
          "javascripts/**/*.map",
          "!javascripts/all.js"
        ],
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
        src: [
          "stylesheets/*.css",
          "!stylesheets/all_css.css"
        ],
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
        src: "fonts/*",
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
        src: "flash/*.swf",
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
        src: "favicons/*",
        dest: "cartodbui/assets/<%= pkg.version %>/"
      },

      avatars: {
        options: {
          headers: {
            "CacheControl": "max-age=864000, public",
            "Expires": new Date(Date.now() + 86400000).toUTCString()
          }
        },
        cwd: '<%= assets_dir %>',
        src: "images/avatars/*.png",
        dest: "cartodbui/assets/unversioned/"
      }

   }
  }
};
