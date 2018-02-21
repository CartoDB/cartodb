var WINDSHAFT_ERRORS = require('../constants').WINDSHAFT_ERRORS;

var WindshaftError = function (error, type, origin) {
  this._error = error;

  this.origin = origin || 'windshaft';
  this.type = getType(error.type, type, WINDSHAFT_ERRORS.GENERIC);
  this.subtype = error.subtype;
  this.message = truncateMessage(error.message);
  this.context = error.context;

  if (this.isLayerError(error.type)) {
    this.context = error.layer && error.layer.context;
    this.layerId = error.layer && error.layer.id;
  }

  if (this.isAnalysisError(error.type) && error.analysis) {
    this.context = error.analysis.context;
    this.analysisId = error.analysis.node_id || error.analysis.id;
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

function getType (originalType, forcedType, genericType) {
  if (!originalType || originalType === WINDSHAFT_ERRORS.UNKNOWN) {
    if (forcedType) {
      return forcedType;
    } else if (originalType !== WINDSHAFT_ERRORS.UNKNOWN) {
      return genericType;
    } else {
      return WINDSHAFT_ERRORS.UNKNOWN;
    }
  } else {
    return originalType;
  }
}

module.exports = WindshaftError;
