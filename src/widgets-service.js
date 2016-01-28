/**
 * Singleton defining the public API to interact with dashboard widgets.
 */
var WidgetsService = function (widgetsCollection) {
  this._widgetsCollection = widgetsCollection;
};

WidgetsService.prototype.get = function (id) {
  return this._widgetsCollection.get(id);
};

WidgetsService.prototype.addCategoryWidget = function () {
};

WidgetsService.prototype.addHistogramWidget = function () {
};

WidgetsService.prototype.addFormulaWidget = function () {
};

WidgetsService.prototype.addTimeSeriesWidget = function (layer, attrs) {
};

var instance = null;
module.exports = {
  getInstance: function (widgetsCollection) {
    if (!instance) {
      instance = new WidgetsService(widgetsCollection);
    }

    return instance;
  }
};
