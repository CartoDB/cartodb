var Stylers = {
  category: require('./category'),
  histogram: require('./histogram')
};

module.exports = {
  get: function (dataviewModel, style) {
    var AutoStyler = Stylers[dataviewModel.get('type')];
    if (AutoStyler) {
      return new AutoStyler(dataviewModel, style);
    } else {
      throw new Error('dataview type not supported');
    }
  }
};
