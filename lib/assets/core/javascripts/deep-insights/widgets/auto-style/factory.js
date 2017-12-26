var Stylers = {
  category: require('./category'),
  histogram: require('./histogram')
};

module.exports = {
  get: function (dataviewModel, layerModel, style) {
    var AutoStyler = Stylers[dataviewModel.get('type')];
    if (AutoStyler) {
      return new AutoStyler(dataviewModel, layerModel, style);
    } else {
      throw new Error('dataview type not supported');
    }
  }
};
