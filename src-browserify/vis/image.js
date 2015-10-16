StaticImage = require('./image/static-image.js');

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

module.exports = Image;
