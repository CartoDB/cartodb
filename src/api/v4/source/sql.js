var SourceBase = require('./base');
var AnalysisModel = require('../../../analysis/analysis-model');
var CamshaftReference = require('../../../analysis/camshaft-reference');

function SourceSQL (id, query) {
  this._id = id;
  this._query = query;
}

SourceSQL.prototype = Object.create(SourceBase.prototype);

SourceSQL.prototype.setQuery = function (query) {
  this._query = query;
  if (this._internalModel) {
    this._internalModel.set('query', query);
  }
  return this;
};

SourceSQL.prototype.getQuery = function () {
  return this._query;
};

SourceSQL.prototype.$setEngine = function (engine) {
  if (!this._internalModel) {
    this._internalModel = new AnalysisModel({
      id: this._id,
      type: 'source',
      query: this._query
    }, {
      camshaftReference: CamshaftReference,
      engine: engine
    });
  }
};

SourceSQL.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = SourceSQL;
