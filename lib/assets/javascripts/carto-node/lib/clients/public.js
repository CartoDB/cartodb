const request = require('request');

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
      {
        'User-Agent': 'carto-node-client',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      additional
    );
  }

  makeRelativeURI (parts) {
    return '/' + parts.join('/');
  }

  makeAbsoluteURI (relativeURI) {
    return this.apiURI + relativeURI;
  }

  makeRequestCallback (callback, resolve, reject) {
    return (err, response, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = null;
      }
      if (typeof callback === 'function') {
        callback(err, response, data);
        return;
      }
      if (err) {
        reject(err);
      }
      if (data === null) {
        reject(new Error('Response could not be parsed as JSON'));
      } else {
        resolve(data);
      }
    };
  }

  getAssetsBaseUrl () {
    return StaticConfig.baseUrl || window.location.protocol + '//' + window.location.host;
  }

  request (method, uriParts, opts = {}, callback) {
    if (!callback && typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    Object.assign(opts, {
      method: method.toUpperCase(),
      uri: this.makeAbsoluteURI(this.makeRelativeURI(uriParts)),
      baseUrl: this.getAssetsBaseUrl()
    });
    this.addHeaders(opts);
    const p = new Promise((resolve, reject) => {
      request(opts, this.makeRequestCallback(callback, resolve, reject));
    });

    if (callback) {
      p.catch(() => {});
      return undefined;
    } else {
      return p;
    }
  }
}

module.exports = exports = PublicClient;
