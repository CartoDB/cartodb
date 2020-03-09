'use strict';

const utils = require('./utils');
const isProduction = process.env.NODE_ENV === 'production';
const sourceMapEnabled = isProduction;

module.exports = {
  loaders: utils.cssLoaders({
    sourceMap: sourceMapEnabled,
    extract: isProduction
  }),
  cssSourceMap: sourceMapEnabled,
  transformToRequire: {
    video: ['src', 'poster'],
    source: 'src',
    img: 'src',
    image: 'xlink:href'
  },
  compilerOptions: {
    whitespace: 'condense'
  }
};
