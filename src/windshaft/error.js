var WINDSHAFT_ERRORS = require('../constants').WINDSHAFT_ERRORS;

var WindshaftError = function (error) {
  this._error = error;

  this.origin = 'windshaft';
  this.type = error.type || WINDSHAFT_ERRORS.GENERIC;
  this.subtype = error.subtype;
  this.message = truncateMessage(error.message);
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

WindshaftError.prototype.isGlobalError = function (errorType) {
  return !this.isLayerError(errorType) && !this.isAnalysisError(errorType);
};

WindshaftError.prototype.isLayerError = function (errorType) {
  errorType = errorType || this._error.type;
  return errorType === WINDSHAFT_ERRORS.LAYER;
};

WindshaftError.prototype.isAnalysisError = function (errorType) {
  errorType = errorType || this._error.type;
  return errorType === WINDSHAFT_ERRORS.ANALYSIS;
};

// Helper functions

function truncateMessage (message) {
  var MAX_SIZE = 256;

  return message && message.length > MAX_SIZE
    ? message.substring(0, MAX_SIZE)
    : message;
}

module.exports = WindshaftError;
