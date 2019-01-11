const webpack = require('webpack');
const merge = require('webpack-merge');
const configBase = require('../webpack.base.config.js');
const entryPoints = require('./entryPoints');
const { version } = require('../../../package.json');

const mergeStrategy = {
  entry: 'replace',
  'output.filename': 'replace'
};

const config = merge.strategy(mergeStrategy)(configBase, {
  entry: entryPoints,

  output: {
    filename: `${version}/javascripts/nd-[name].js`
  },

  plugins: [
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/)
  ]
});

module.exports = config;
