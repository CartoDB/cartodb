module.exports = function () {
  var stylesWithoutAutostyles;

  return function (layerDefModel) {
    var isAutoStyleActive = !!layerDefModel.get('autoStyle');

    if (!isAutoStyleActive) {
      stylesWithoutAutostyles = {
        previousCartoCSS: layerDefModel.get('cartocss'),
        previousCartoCSSCustom: layerDefModel.attributes.cartocss_custom
      };
    }

    return stylesWithoutAutostyles;
  };
};
