var $ = require('jquery');
var UrlShortener = require('../../../../javascripts/cartodb/common/url_shortener');

describe('common/url_shortener', function() {
  beforeEach(function() {
    cdb.config.set('bitly_key', 'hello');
    cdb.config.set('bitly_login', 'hello');
    this.urlShortener = new UrlShortener();
    this.successSpy = jasmine.createSpy('success');
    this.errorSpy = jasmine.createSpy('error');
  });

  describe('.fetch', function() {
    describe('when given URL has already been requested', function() {
      beforeEach(function() {
        spyOn(this.urlShortener.localStorage, 'search').and.returnValue('http://cdb.io/1DD3v0H');
        this.urlShortener.fetch('original url', { success: this.successSpy });
      });

      it('should call success with cached URL', function() {
        expect(this.successSpy).toHaveBeenCalledWith('http://cdb.io/1DD3v0H');
      });
    });

    describe('when given has not yet been shortened', function() {
      beforeEach(function() {
        spyOn($, 'ajax');
        this.urlShortener.fetch('http://cartodb.com/user/user/viz/a5209d8e-ecb8-11e4-9caf-080027880ca6/public_map', {
          success: this.successSpy,
          error: this.errorSpy
        });
        this.args = $.ajax.calls.argsFor(0)[0];
      });

      it('should have called bitly to shorten the URL', function() {
        expect(this.args.url).toContain('bitly.com');
        expect(this.args.type).toEqual('GET');
        expect(this.args.async).toEqual(false);
        expect(this.args.dataType).toEqual('jsonp');
        expect(this.args.url).toContain('http%3A%2F%2Fcartodb.com%2Fuser%2Fuser%2Fviz%2Fa5209d8e-ecb8-11e4-9caf-080027880ca6%2Fpublic_map');
      });

      describe('when shortening succeeds', function() {
        beforeEach(function() {
          spyOn(this.urlShortener.localStorage, 'add');
          this.res = {
            status_code: 200,
            data: {
              long_url: 'http://cartodb.com/user/user/viz/a5209d8e-ecb8-11e4-9caf-080027880ca6/public_map',
              url: 'http://cdb.io/1DD3v0H',
              hash: '1DD3v0H',
              global_hash: '1DD3v0I',
              new_hash: 0
            }
          };
          this.args.success(this.res);
        });

        it('should persist the URL', function() {
          expect(this.urlShortener.localStorage.add).toHaveBeenCalledWith({
            'http://cartodb.com/user/user/viz/a5209d8e-ecb8-11e4-9caf-080027880ca6/public_map': 'http://cdb.io/1DD3v0H'
          });
        });

        it('should call the success callback', function() {
          expect(this.successSpy).toHaveBeenCalledWith('http://cdb.io/1DD3v0H');
        });

        it('should call error callback with original URL if there is no url', function() {
          this.args.success({});
          expect(this.errorSpy).toHaveBeenCalledWith('http://cartodb.com/user/user/viz/a5209d8e-ecb8-11e4-9caf-080027880ca6/public_map');
        });
      });

      describe('when shortening fails', function() {
        beforeEach(function() {
          this.args.error(new Error('something failed'));
        });

        it('should call error callback with original URL', function() {
          expect(this.errorSpy).toHaveBeenCalledWith('http://cartodb.com/user/user/viz/a5209d8e-ecb8-11e4-9caf-080027880ca6/public_map');
        });
      });
    });
  });

  afterEach(function() {
    cdb.config.unset('bitly_login');
    cdb.config.unset('bitly_key');
    this.urlShortener.localStorage.destroy();
  });
});
