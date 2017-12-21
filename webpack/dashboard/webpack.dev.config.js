const webpack = require('webpack');
const {resolve} = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const PACKAGE = require('../../package.json');
const version = PACKAGE.version;

const stats = (env) => {
  return env && env.stats;
};

const isVendor = (module, count) => {
  const userRequest = module.userRequest;
  return userRequest && userRequest.indexOf('node_modules') >= 0;
};

const entryPoints = {
  'user-feed': resolve(__dirname, '../../', 'lib/assets/core/javascripts/dashboard/user-feed.js')
};

module.exports = env => {
  return {
    entry: entryPoints,
    output: {
      filename: `${version}/javascripts/[name].js`,
      path: resolve(__dirname, '../../', 'public/assets')
    },
    resolve: {
      symlinks: false,
      modules: [
        resolve(__dirname, '../../', 'node_modules'),
        resolve(__dirname, '../../', 'lib/assets/node_modules')
      ]
    },
    devtool: 'source-map',
    plugins: [
      stats(env) ? new BundleAnalyzerPlugin({
        analyzerMode: 'static'
      }) : undefined
    ].concat(
      // For each entry point, we generate the vendor file
      Object.keys(entryPoints)
        .map(entry => new webpack.optimize.CommonsChunkPlugin({
          name: `${entry}_vendor`,
          chunks: [entry],
          minChunks: isVendor
        }))
    )
      .concat([
      // Extract common chuncks from the 3 vendor files
        new webpack.optimize.CommonsChunkPlugin({
          name: 'common',
          chunks: Object.keys(entryPoints).map(n => `${n}_vendor`),
          minChunks: (module, count) => {
            return count >= Object.keys(entryPoints).length && isVendor(module);
          }
        }),

        // Extract common chuncks from the 3 entry points
        new webpack.optimize.CommonsChunkPlugin({
          children: true,
          minChunks: Object.keys(entryPoints).length
        }),

        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery',
          'window.jQuery': 'jquery'
        }),

        new webpack.DefinePlugin({
          __IN_DEV__: JSON.stringify(true),
          __ENV__: JSON.stringify('dev')
        })
      ])
      .filter(p => !!p), // undefined is not a valid plugin, so filter undefined values here
    module: {
      rules: [

      ]
    },

    node: {
      fs: 'empty' // This fixes the error Module not found: Error: Can't resolve 'fs'
    },

    stats: 'normal'
  };
};
