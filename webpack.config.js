var path = require('path');

module.exports = {
  entry: './src/api/v4/index.js',
  output: {
    path: path.resolve(__dirname, 'dist/public'),
    filename: 'carto.bundle.js',
    library: 'carto',
    libraryTarget: 'umd'
  },
  // Tell webpack not to include Leaflet in the bundle. Leaflet should will be included manually
  externals: {
    leaflet: 'L'
  }
};
