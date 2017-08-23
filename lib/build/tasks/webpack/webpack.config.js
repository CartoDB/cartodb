var path = require('path');
var webpack = require('webpack');

module.exports = {
  task: function () {
    var cfg = {};

    cfg.builder_specs = {
      entry: {
        main: [
          // To be filled by grunt
        ]
      },
      output: {
        path: path.resolve(path.resolve('.'), '.grunt'),
        filename: '[name].affected-specs.js'
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            loader: 'shim-loader',
            query: {
              shim: {
                'wax.cartodb.js': {
                  exports: 'wax'
                },
                'html-css-sanitizer': {
                  exports: 'html'
                }
              }
            }
          },
          {
            test: /\.js$/,
            loader: 'babel-loader',
            include: [path.resolve(path.resolve('.'), 'node_modules/tangram.cartodb')],
            options: {
              presets: [
                ['es2015', { 'modules': false }]
              ]
            }
          },
          {
            test: /\.tpl$/,
            use: 'tpl-loader'
          },
          {
            test: /\.mustache$/,
            use: 'raw-loader'
          }
        ],
        exprContextRegExp: /$^/,
        exprContextCritical: false
      },
      plugins: [
        new webpack.optimize.CommonsChunkPlugin({
          name: 'vendor',
          minChunks: function (module) {
            return module.context && module.context.indexOf('node_modules') !== -1;
          }
        }),
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery',
          ['window.jQuery']: 'jquery',
          L: 'leaflet'
        }),
        new webpack.SourceMapDevToolPlugin({
          filename: '[file].map',
          exclude: /vendor/
        })
      ],
      target: 'web',
      node: {
        fs: 'empty'
      },
      stats: 'normal'
    };

    return cfg;
  }
};
