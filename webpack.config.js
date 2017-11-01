var path = require('path');

module.exports = {
  entry: './src/api/v4/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'carto.bundle.js',
    library: 'carto',
    libraryTarget: 'umd'
  }
};
