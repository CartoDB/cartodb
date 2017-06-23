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
      // resolve: {
      //   alias: {
      //     d3: path.resolve('./node_modules/cartodb.js/node_modules/d3/d3.js'),
      //     'cartodb.js': path.resolve('./node_modules/cartodb.js'),
      //     'trangram.cartodb.debug.js': path.resolve('./node_modules/cartodb.js/node_modules/tangram.cartodb/dist/trangram.cartodb.debug.js')
      //   }
      // }
    };

    return cfg;
  }
};
