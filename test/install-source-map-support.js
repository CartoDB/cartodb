/**
 * See https://github.com/evanw/node-source-map-support#browser-support
 * This is expected to be included in a browserify-module to give proper stack traces, based on browserify's source maps.
 */
sourceMapSupport.install({
  retrieveSourceMap: function (source) {
    // This "stops" source-map-support from trying to load source maps
    // for the Google Maps JS library, which triggers a CORS error when
    // running tests via Google Chrome
    if (source.indexOf('maps.googleapis.com/maps') >= 0) {
      return {
        url: '',
        map: {
          version: 3,
          file: 'something.js.map',
          sources: [],
          sourceRoot: '/',
          names: [],
          mappings: ''
        }
      };
    }
    return null;
  }
});
