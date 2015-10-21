// NOTE this does not return a Image directly, but a wrapper, to inject the dependencies
// e.g. var Image = require('./image')(StaticImage);
// @param {Object} StaticImage
module.exports = function(StaticImage) {
  var Image = function(data, options) {

    if (!options) options = {};

    var image = new StaticImage();

    if (typeof data === 'string') {
      image.load(data, options);
    } else {
      image.loadLayerDefinition(data, options);
    }

    return image;

  };

  return Image;
};
