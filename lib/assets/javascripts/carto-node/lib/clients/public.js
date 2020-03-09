const $ = require('jquery');

window.StaticConfig = window.StaticConfig || {};

class PublicClient {
  constructor (apiURI = '') {
    this.apiURI = apiURI;
  }

  get (...args) {
    return this.request('get', ...args);
  }

  put (...args) {
    return this.request('put', ...args);
  }

  post (...args) {
    return this.request('post', ...args);
  }

  delete (...args) {
    return this.request('delete', ...args);
  }

  addHeaders (obj, additional) {
    return Object.assign(
      {},
      obj.headers,
      additional
    );
  }

  paramsToURI (params) {
    const DEFAULT_PARAMS = '';

    return this.checkParams(params)
      ? `?${Object
        .keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')}`
      : DEFAULT_PARAMS;
  }

  checkParams (params) {
    const OBJECT_TYPE = '[object Object]';

    return params &&
      Object.prototype.toString.call(params) === OBJECT_TYPE &&
      Object.keys(params).length;
  }

  makeRelativeURI (parts) {
    return `/${parts.join('/')}`;
  }

  makeAbsoluteURI (relativeURI) {
    return `${this.apiURI}${relativeURI}`;
  }

  successCallback (callback) {
    return (data, textStatus, jqXHR) => {
      try {
        data = JSON.parse(JSON.stringify(data));
      } catch (e) {
        data = null;
      }

      callback(null, textStatus, data);
    };
  }

  errorCallback (callback) {
    return (jqXHR, textStatus, errorThrown) => {
      const err = errorThrown || new Error('Failed to fetch');
      callback(err, textStatus, jqXHR);
    };
  }

  getAssetsBaseUrl () {
    const { host, protocol } = window.location;

    const regExp = window.location.href.match(/(\/(u|user)\/[a-z0-9\-]+)\//);
    const path = regExp && regExp[1] || '';

    return window.StaticConfig.baseUrl || `${protocol}//${host}${path}`;
  }

  request (method, uriParts, opts = {}, callback) {
    if (!callback && typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    const contentType = opts.doNoSetDefaultContentType
      ? false
      : 'application/json; charset=utf-8';

    Object.assign(opts, {
      contentType: contentType,
      method: method.toUpperCase()
    });

    this.addHeaders(opts);

    const baseUrl = opts.baseUrl || this.getAssetsBaseUrl();
    const url = uriParts.length !== 0
      ? this.makeAbsoluteURI(this.makeRelativeURI(uriParts))
      : '';

    const requestOptions = Object.assign({}, opts,
      {
        success: this.successCallback(callback),
        error: this.errorCallback(callback)
      }
    );

    $.ajax(`${baseUrl}${url}`, requestOptions);
  }
}

module.exports = exports = PublicClient;
