
var createDashboard = require('./create-dashboard');
var cdb = require('cartodb.js');

function Dashboard(dashboard) {
  this.dashboard = dashboard;

  // bind widget related methods
  var ws = dashboard.widgets;
  this.createCategory = ws.createCategoryModel.bind(ws);
  this.createHistogram = ws.createHistogramModel.bind(ws);
  this.createFormula = ws.createFormulaModel.bind(ws);
  this.createTimeSeries = ws.createTimeSeriesModel.bind(ws);
  this.getWidget = ws.get.bind(ws);
  this.getWidgets = ws.getList.bind(ws);
}

Dashboard.prototype = {
  getMap: function() {
    return this.dashboard.vis;
  }
};

module.exports = function (selector, vizJSON, opts, callback) {

  var args = arguments,
      fn   = args[args.length -1];

  if (_.isFunction(fn)) {
    callback = fn;
  }

  function _load(vizJSON) {
    var dashboard = createDashboard(selector, vizJSON, opts);
    dashboard.vis.done(function() {
      callback(null, new Dashboard(dashboard));
    });
  }

  if (typeof (vizJSON) === 'string') {
    cdb.core.Loader.get(vizJSON, function (data) {
      if (data) {
        _load(data, opts);
      } else {
        callback(new Error('error fetching viz.json file'));
      }
    });
   }

}

