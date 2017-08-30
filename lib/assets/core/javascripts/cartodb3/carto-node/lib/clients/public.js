const $ = require('jquery');

window.StaticConfig = window.StaticConfig || {};

class PublicClient {
  constructor (apiURI = '/api/v3') {
    this.apiURI = apiURI;
    this.API_LIMIT = 100;
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
    obj.headers = obj.headers || {};

    return Object.assign(
      obj.headers,
      additional
    );
  }

  makeRelativeURI (parts) {
    return '/' + parts.join('/');
  }

  makeAbsoluteURI (relativeURI) {
    return this.apiURI + relativeURI;
  }

  makeRequestCallback (callback) {
    return (data, response, err) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = null;
      }

      callback(err, response, data);

      return;
    };
  }

  getAssetsBaseUrl () {
    return window.StaticConfig.baseUrl || window.location.protocol + '//' + window.location.host;
  }

  request (method, uriParts, opts = {}, callback) {
    if (!callback && typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    Object.assign(opts, {
      'contentType': 'application/json; charset=utf-8',
      'method': method.toUpperCase()
    });

    this.addHeaders(opts);

    const baseUrl = this.getAssetsBaseUrl();
    const url = this.makeAbsoluteURI(this.makeRelativeURI(uriParts));

    $.ajax(`${baseUrl}${url}`, opts)
      .always(this.makeRequestCallback(callback));
  }
}

module.exports = exports = PublicClient;
