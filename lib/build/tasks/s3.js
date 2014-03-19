
module.exports = {
  task: function() {
    return {
      options: {
        accessKeyId: '<%= aws.key %>', // Use the variables
        secretAccessKey: '<%= aws.secret %>', // You can also use env variables
        uploadConcurrency: 5, // 5 simultaneous uploads
        downloadConcurrency: 5, // 5 simultaneous downloads
      },
      production: {
        options: {
          bucket: '<%= aws.bucket %>',
          //differential: true
          params: {
            "CacheControl": "max-age=630720000, public",
            "Expires": new Date(Date.now() + 63072000000)
          }
        },
        files: [
          {expand: true, cwd: '<%= root_assets_dir %>', src: ['**/*'], dest: 'cartodbui/', action: 'upload'}
        ]
      }
    }


    //return {
      //options: {
        //key: '<%= aws.key %>',
        //secret: '<%= aws.secret %>',
        //bucket: '<%= aws.bucket %>',
        //access: 'public-read',
        //headers: {
          //// Two Year cache policy (1000 * 60 * 60 * 24 * 730)
          //"Cache-Control": "max-age=630720000, public",
          //"Expires": new Date(Date.now() + 63072000000).toUTCString()
        //}
      //},
      //production: {
        //// These options override the defaults
        //options: {
          //encodePaths: true,
          //maxOperations: 20
        //},
        //// Files to be uploaded.
        //upload: [
          //{
            //src: '<%= assets_dir %>/**/*',
            //dest: 'cartodbui/',
            //rel: '<%= assets_dir %>',
            //options: { gzip: true }
          //}
          ////{
            ////src: 'passwords.txt',
            ////dest: 'documents/ignore.txt',

            ////// These values will override the above settings.
            ////options: {
              ////bucket: 'some-specific-bucket',
              ////access: 'authenticated-read'
            ////}
          ////},
        //]
      //}
    //};
  }
};
