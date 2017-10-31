var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

function SQL (id, query) {
  this._id = id;
  this._query = query;
}

SQL.prototype.$setEngine = function (engine) {
  this._internalModel = new AnalysisModel({
    id: this._id,
    type: 'source',
    query: this._query
  }, {
    camshaftReference: CamshaftReference,
    engine: engine
  });
};

SQL.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = SQL;
