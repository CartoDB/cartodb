var cdb = require('cartodb.js');
var $ = require('jquery');
var LocalStorage = require('./local_storage');

var UrlShortener = function() {
  this._LOGIN = cdb.config.get('bitly_login');
  this._KEY = cdb.config.get('bitly_key');
  this.localStorage = new LocalStorage('cartodb_urls2'); // to not clash with old local storage cache, they're incompatible
};

UrlShortener.prototype.fetch = function(originalUrl, callbacks) {
  var cachedUrl = this.localStorage.search(originalUrl);
  var self = this;

  if (cachedUrl) {
    return callbacks.success(cachedUrl);
  }

  if (!this._LOGIN || !this._KEY) {
    return callbacks.error(originalUrl);
  }

  $.ajax({
    url: 'https://api-ssl.bitly.com/v3/shorten?longUrl=' + encodeURIComponent(originalUrl) + '&login=' + this._LOGIN + '&apiKey=' + this._KEY,
    type: 'GET',
    async: false,
    dataType: 'jsonp',
    success: function(res) {
      if (res && res.data && res.data.url) {
        var shortURL = res.data.url;
        var d = {};
        d[originalUrl] = shortURL;
        self.localStorage.add(d);

        callbacks.success(shortURL);
      } else {
        callbacks.error(originalUrl);
      }
    },
    error: function() {
      callbacks.error(originalUrl);
    }
  });
};

module.exports = UrlShortener;
