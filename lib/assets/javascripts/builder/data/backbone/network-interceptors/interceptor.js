const $ = require('jquery');
const _ = require('underscore');

/**
 * Network Interceptors
 *
 * Tool to easily intercept network responses in order
 * to override or add behaviours on top of the usual ones
 */

function NetworkResponseInterceptor () {
  this._originalAjax = $.ajax;
  this._successInterceptors = [];
  this._errorInterceptors = [];
  this._urlPatterns = [];
}

NetworkResponseInterceptor.prototype.start = function () {
  let onRequestStart = this._onRequestStart.bind(this);

  this._onRequestStart = onRequestStart;
  $.ajax = onRequestStart;
};

NetworkResponseInterceptor.prototype.stop = function () {
  $.ajax = this._originalAjax;
};

NetworkResponseInterceptor.prototype.addURLPattern = function (pattern) {
  this._urlPatterns.push(pattern);
};

NetworkResponseInterceptor.prototype.addSuccessInterceptor = function (interceptorFn) {
  this._successInterceptors.push(interceptorFn);
};

NetworkResponseInterceptor.prototype.addErrorInterceptor = function (interceptorFn) {
  this._errorInterceptors.push(interceptorFn);
};

NetworkResponseInterceptor.prototype._shouldListenToRequest = function (url) {
  let patternChecks = this._urlPatterns.map(function (pattern) {
    return url.indexOf(pattern) > -1;
  });

  return _.some(patternChecks);
};

NetworkResponseInterceptor.prototype._onRequestStart = function (url, options) {
  let requestUrl = null;
  let requestOptions = {};

  if (typeof url === 'string') {
    requestUrl = url;
  } else if (typeof url === 'object' && url.url) {
    requestUrl = url.url;
  }

  if (options) {
    requestOptions = options;
  } else if (typeof url === 'object') {
    requestOptions = url;
  }

  if (!this._shouldListenToRequest(requestUrl)) {
    return this._originalAjax.apply(this, arguments);
  }

  if (requestOptions.error || requestOptions.success) {
    const errorCallback = requestOptions.error;
    const successCallback = requestOptions.success;

    const interceptErrorFn = function () {
      this._applyErrorInterceptors.apply(this, arguments);
      errorCallback && errorCallback.apply(this, arguments);
    };

    const interceptSuccessFn = function () {
      this._applySuccessInterceptors.apply(this, arguments);
      successCallback && successCallback.apply(this, arguments);
    };

    requestOptions.error = interceptErrorFn.bind(this);
    requestOptions.success = interceptSuccessFn.bind(this);
  }

  return this._originalAjax(requestUrl, requestOptions);
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

module.exports = new NetworkResponseInterceptor();
module.exports.NetworkResponseInterceptor = NetworkResponseInterceptor;
