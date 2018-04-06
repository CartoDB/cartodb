var path = require('path');
var webpack = require('webpack');

/*
  This function will be called with the config name (dashboard_specs, builder_spec) so
  you have a change to customize webpack for each bundle.
*/
module.exports = {
  task: function (config) {
    return {
      entry: {
        main: [
          // To be filled by grunt
        ]
      },
      output: {
        path: path.resolve(path.resolve('.'), '.grunt', config),
        filename: '[name].affected-specs.js'
      },
      resolve: {
        symlinks: false,
        modules: require('../../../../webpack/common/modules.js'),
        alias: require('../../../../webpack/common/alias')
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            loader: 'shim-loader',
            query: {
              shim: {
                'html-css-sanitizer': {
                  exports: 'html'
                }
              }
            }
          },
          {
            test: /\.js$/,
            loader: 'babel-loader',
            include: [
              path.resolve(path.resolve('.'), 'lib/assets/javascripts/carto-node'),
              path.resolve(path.resolve('.'), 'lib/assets/test/spec/carto-node'),
              path.resolve(path.resolve('.'), 'lib/assets/javascripts/dashboard'),
              path.resolve(path.resolve('.'), 'lib/assets/test/spec/dashboard'),
              path.resolve(path.resolve('.'), 'lib/assets/test/spec/fixtures'),
              path.resolve(path.resolve('.'), 'lib/assets/javascripts/dashboard')
            ],
            options: {
              presets: [
                ['es2015', { 'modules': false }]
              ],
              plugins: ['transform-object-assign', 'transform-object-rest-spread']
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
          L: 'leaflet',
          'window.jQuery': 'jquery'
        }),
        new webpack.SourceMapDevToolPlugin({
          filename: '[file].map',
          exclude: /vendor/
        }),
        new webpack.DefinePlugin({
          __ENV__: JSON.stringify('test')
        })
      ],
      target: 'web',
      node: {
        fs: 'empty'
      }
    };
  }
};
