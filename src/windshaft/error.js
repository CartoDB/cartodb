var ERROR_TYPE_LAYER = 'layer';
var ERROR_TYPE_ANALYSIS = 'analysis';

var WindshaftError = function (error) {
  this._error = error;

  this.type = error.subtype;
  this.message = error.message;
  this.context = error.context;

  if (this.isLayerError(error.type)) {
    this.context = error.layer && error.layer.context;
    this.layerId = error.layer && error.layer.id;
  }
  if (this.isAnalysisError(error.type)) {
    this.context = error.analysis && error.analysis.context;
    this.analysisId = error.analysis && error.analysis.node_id;
  }
};

WindshaftError.prototype.isLayerError = function (errorType) {
  errorType = errorType || this._error.type;
  return errorType === ERROR_TYPE_LAYER;
};

WindshaftError.prototype.isAnalysisError = function (errorType) {
  errorType = errorType || this._error.type;
  return errorType === ERROR_TYPE_ANALYSIS;
};

module.exports = WindshaftError;
