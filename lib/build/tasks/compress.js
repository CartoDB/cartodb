exports.task = function () {
  return {
    main: {
      options: {
        archive: '<%= public_dir %>/static.tar.gz'
      },
      files: [
        {
          expand: true,
          cwd: '<%= public_dir %>',
          dest: '/',
          src: [
            '*.html',
            'crossdomain.xml',
            'robots.txt',
            'static/**',
            'maintenance/**',
            'favicons/**'
          ]
        }
      ]
    }
  };
};
