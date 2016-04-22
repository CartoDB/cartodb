var CategoryAutoStyler = require('./category');
var HistogramAutoStyler = require('./histogram');
module.exports = {
  get: function (dataviewModel) {
    if (dataviewModel.get('type') === 'category') {
      return new CategoryAutoStyler(dataviewModel);
    } else if (dataviewModel.get('type') === 'histogram') {
      return new HistogramAutoStyler(dataviewModel);
    } else {
      throw new Error('dataview type not supported');
    }
  }
}