var $ = require('jquery');
var LocalStorage = require('./local_storage');

var LOGIN = 'vizzuality';
var KEY = 'R_de188fd61320cb55d359b2fecd3dad4b';

var UrlShortener = function() {
  this.localStorage = new LocalStorage('cartodb_urls2'); // to not clash with old local storage cache, they're incompatible
};

UrlShortener.prototype.fetch = function(originalUrl, callbacks) {
  var cachedUrl = this.localStorage.search(originalUrl);
  if (cachedUrl) {
    return callbacks.success(cachedUrl);
  }

  var self = this;
  $.ajax({
    url: 'https://api-ssl.bitly.com/v3/shorten?longUrl=' + encodeURIComponent(originalUrl) + '&login=' + LOGIN + '&apiKey=' + KEY,
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
