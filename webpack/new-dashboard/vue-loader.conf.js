'use strict'

const utils = require('./utils');
const isProduction = process.env.NODE_ENV === 'production';
const sourceMapEnabled = isProduction;

module.exports = {
  loaders: utils.cssLoaders({
    sourceMap: sourceMapEnabled,
    extract: isProduction
  }),
  cssSourceMap: sourceMapEnabled,
  // cacheBusting: config.dev.cacheBusting,
  transformToRequire: {
    video: ['src', 'poster'],
    source: 'src',
    img: 'src',
    image: 'xlink:href'
  }
}
