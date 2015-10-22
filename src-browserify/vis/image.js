module.exports = function(StaticImage) {
  if (!StaticImage) throw new Error('StaticImage is required');

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
