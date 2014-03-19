
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
            "Cache-Control": "max-age=630720000, public",
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
            "Cache-Control": "max-age=630720000, public",
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
            "Cache-Control": "max-age=630720000, public",
            "Expires": new Date(Date.now() + 63072000000).toUTCString()
          }
        },
        cwd: '<%= assets_dir %>',
        src: "images/**/*",
        dest: "cartodbui/<%= pkg.version %>/"
      }
    }
  }
};
