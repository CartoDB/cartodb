var path = require('path');
var webpack = require('webpack');

/*
  This function will be called with the config name (dashboard_specs, builder_spec) so
  you have a change to customize webpack for each bundle.
*/
module.exports = {
  task: function (config) {
    return {
      mode: 'development',
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
              path.resolve(path.resolve('.'), 'lib/assets/javascripts/builder'),
              path.resolve(path.resolve('.'), 'lib/assets/test/spec/dashboard'),
              path.resolve(path.resolve('.'), 'lib/assets/test/spec/fixtures'),
              path.resolve(path.resolve('.'), 'lib/assets/test/spec/builder'),
              path.resolve(path.resolve('.'), 'node_modules/internal-carto.js')
            ],
            options: {
              babelrc: false,
              configFile: false,
              presets: ['@babel/env'],
              plugins: ['@babel/plugin-transform-object-assign']
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
      optimization: {
        splitChunks: {
          cacheGroups: {
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/
            }
          }
        }
      },
      plugins: [
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
