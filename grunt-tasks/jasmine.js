/**
* https://github.com/gruntjs/grunt-contrib-jasmine#options
* <script> order: vendor, helpers, source, specs,
*/
module.exports = {
  'src': {
    options: {
      outfile: 'spec/index.html',
      vendor: [
        // Load & install the source-map-support lib (get proper stack traces from inlined source-maps)
        "node_modules/source-map-support/browser-source-map-support.js",
        "spec/install-source-map-support.js",
        '<%= config.tmp %>/vendor.js'
      ],
      specs: '<%= config.tmp %>/specs.js', // built by browserify
      keepRunner: true,
      summary: true,
      display: 'short'
    },
    src: [] // actual src files are require'd in the *.spec.js files
  }
}
