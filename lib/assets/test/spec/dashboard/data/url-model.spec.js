var UrlModel = require('dashboard/data/url-model');

describe('dashboard/data/url-model', function () {
  beforeEach(function () {
    this.baseUrl = 'http://subdomain.carto.com/foobar';
    this.url = new UrlModel({ base_url: this.baseUrl });
  });

  describe('.pathname', function () {
    it('should return the full path of this URL', function () {
      expect(this.url.pathname()).toEqual('/foobar');
    });
  });

  describe('.urlToPath', function () {
    describe('when given no arguments', function () {
      beforeEach(function () {
        this.newUrl = this.url.urlToPath();
      });

      it('should return a new url object', function () {
        expect(this.newUrl).not.toBe(this.url);
        expect(this.newUrl instanceof UrlModel).toBeTruthy();
      });

      it('should return a new url object that have the same base url', function () {
        expect(this.newUrl.get('base_url')).toContain(this.baseUrl);
      });
    });

    describe('when given any argument', function () {
      beforeEach(function () {
        this.newUrl = this.url.urlToPath('sub', 'path');
      });

      it('should return a new url object that have same base url', function () {
        expect(this.newUrl.get('base_url')).toContain(this.baseUrl);
      });

      it('should return a new url object that have the given params as path', function () {
        expect(this.newUrl.get('base_url')).toContain(this.baseUrl + '/sub/path');
      });
    });
  });

  describe('.toString', function () {
    it('should return the string representation of the URL', function () {
      expect(this.url.toString()).toEqual(this.baseUrl);
    });
  });
});
