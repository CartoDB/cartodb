var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Network Interceptors
 *
 * Tool to easily intercept network responses in order
 * to override or add behaviours on top of the usual ones
 */

function NetworkResponseInterceptor () {
  this._originalSync = Backbone.sync;
  this._successInterceptors = [];
  this._errorInterceptors = [];
  this._urlPatterns = [];
}

NetworkResponseInterceptor.prototype.patchBackboneSync = function () {
  Backbone.sync = this._onSyncStart.bind(this);
};

NetworkResponseInterceptor.prototype.addSuccessInterceptor = function (urlPattern, interceptorFn) {
  this._successInterceptors.push(interceptorFn);
  this._addPattern(urlPattern);
};

NetworkResponseInterceptor.prototype.addErrorInterceptor = function (urlPattern, interceptorFn) {
  this._errorInterceptors.push(interceptorFn);
  this._addPattern(urlPattern);
};

NetworkResponseInterceptor.prototype._onSyncStart = function (method, model, options) {
  var requestURL = model.url();

  if (!this._shouldListenToRequest(requestURL)) {
    return this._originalSync.apply(this, arguments);
  }

  const errorCallback = options.error;
  const successCallback = options.success;

  const interceptErrorFn = function () {
    this._applyErrorInterceptors.apply(this, arguments);
    errorCallback.apply(this, arguments);
  };

  const interceptSuccessFn = function () {
    this._applySuccessInterceptors.apply(this, arguments);
    successCallback.apply(this, arguments);
  };

  options.error = interceptErrorFn.bind(this);
  options.success = interceptSuccessFn.bind(this);

  return this._originalSync.apply(this, arguments);
};

NetworkResponseInterceptor.prototype._addPattern = function (pattern) {
  this._urlPatterns.push(pattern);
};

NetworkResponseInterceptor.prototype._applyErrorInterceptors = function (xhr, textStatus, errorThrown) {
  if (!this._errorInterceptors.length) {
    return;
  }

  this._errorInterceptors.map(function (interceptorFunction) {
    interceptorFunction(xhr, textStatus, errorThrown);
  });
};

NetworkResponseInterceptor.prototype._applySuccessInterceptors = function (response, textStatus, xhr) {
  if (!this._successInterceptors.length) {
    return;
  }

  this._successInterceptors.map(function (interceptorFunction) {
    interceptorFunction(response, textStatus, xhr);
  });
};

NetworkResponseInterceptor.prototype._shouldListenToRequest = function (url) {
  var patternChecks = this._urlPatterns.map(function (pattern) {
    return url.indexOf(pattern) > -1;
  });

  return _.some(patternChecks);
};

module.exports = new NetworkResponseInterceptor();
