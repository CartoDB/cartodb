var ERROR_TYPE_LAYER = 'layer';
var ERROR_TYPE_ANALYSIS = 'analysis';

var WindshaftError = function (error) {
  this._error = error;

  this.type = error.subtype;
  this.message = error.message;
  this.context = error.context;

  if (this._isLayerError(error.type)) {
    this.context = error.layer && error.layer.context;
    this.layerId = error.layer.id;
  }
  if (this._isAnalysisError(error.type)) {
    this.context = error.analysis && error.analysis.context;
    this.analysisId = error.analysis.id;
  }
};

WindshaftError.prototype.isLayerError = function () {
  return this._isLayerError(this._error.type);
};

WindshaftError.prototype._isLayerError = function (errorType) {
  return errorType === ERROR_TYPE_LAYER;
};

WindshaftError.prototype.isAnalysisError = function () {
  return this._isAnalysisError(this._error.type);
};

WindshaftError.prototype._isAnalysisError = function (errorType) {
  return errorType === ERROR_TYPE_ANALYSIS;
};

module.exports = WindshaftError;
