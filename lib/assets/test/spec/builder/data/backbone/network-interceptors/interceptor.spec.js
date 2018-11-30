var NetworkInterceptor = require('builder/data/backbone/network-interceptors/interceptor').NetworkResponseInterceptor;
var $ = require('jquery');

describe('data/backbone/network-interceptors/interceptor', function () {
  var interceptor;

  beforeEach(function () {
    jasmine.Ajax.install();
    interceptor = new NetworkInterceptor();
  });

  afterEach(function () {
    interceptor.stop();
    jasmine.Ajax.uninstall();
  });

  describe('.start', function () {
    it('should monkey-patch jQuery.ajax', function () {
      var originalAjax = $.ajax;

      interceptor.start();

      expect(interceptor._originalAjax).toBe(originalAjax);
      expect($.ajax).toBe(interceptor._onRequestStart);
    });
  });

  describe('.addURLPattern', function () {
    it('should add URL pattern to intercept', function () {
      interceptor.addURLPattern('/api/test-url');

      expect(interceptor._urlPatterns).toContain('/api/test-url');
    });
  });

  describe('.addSuccessInterceptor', function () {
    it('should add success interceptor function', function () {
      var interceptorFn = function () {};

      interceptor.addSuccessInterceptor(interceptorFn);

      expect(interceptor._successInterceptors).toContain(interceptorFn);
    });
  });

  describe('.addErrorInterceptor', function () {
    it('should add error interceptor function', function () {
      var interceptorFn = function () {};

      interceptor.addErrorInterceptor(interceptorFn);

      expect(interceptor._errorInterceptors).toContain(interceptorFn);
    });
  });

  describe('._shouldListenToRequest', function () {
    it('should return true if URL matches any patterns', function () {
      interceptor.addURLPattern('/api/test');

      expect(interceptor._shouldListenToRequest('/api/test')).toBe(true);
    });

    it('should return false if URL doesn\'t match any patterns', function () {
      interceptor.addURLPattern('/api/non-matching-url');

      expect(interceptor._shouldListenToRequest('/api/test')).toBe(false);
    });

    it('should return false if there aren\'t any patterns registered', function () {
      expect(interceptor._shouldListenToRequest('/api/test')).toBe(false);
    });
  });

  describe('._onRequestStart', function () {
    var originalAjax;

    beforeEach(function () {
      originalAjax = interceptor._originalAjax;
      spyOn(interceptor, '_originalAjax').and.callThrough();
    });

    afterEach(function () {
      interceptor._originalAjax = originalAjax;
    });

    it('should fallback to original $.ajax if request should not be intercepted', function () {
      var requestOptions = {
        url: 'http://localhost:3000/api/test'
      };

      interceptor._onRequestStart(requestOptions);

      var ajaxCall = interceptor._originalAjax.calls.mostRecent();
      var requestOptionsInCall = ajaxCall.args[0];
      expect(interceptor._originalAjax).toHaveBeenCalledWith(requestOptions);
      expect(requestOptionsInCall.error).toBeUndefined();
      expect(requestOptionsInCall.success).toBeUndefined();
    });

    it('should add our callbacks in request options', function () {
      var requestOptions = {
        url: 'http://localhost:3000/api/test',
        success: jasmine.createSpy('success'),
        error: jasmine.createSpy('error')
      };

      interceptor._onRequestStart(requestOptions);

      var ajaxCall = interceptor._originalAjax.calls.mostRecent();
      var requestOptionsInCall = ajaxCall.args[0];
      expect(interceptor._originalAjax).toHaveBeenCalledWith(requestOptions);
      expect(requestOptionsInCall.error).toBeDefined();
      expect(requestOptionsInCall.success).toBeDefined();
    });

    it('should call success callback and apply interceptors when request is successful', function () {
      var successCallback = jasmine.createSpy('success');
      spyOn(interceptor, '_applySuccessInterceptors');

      interceptor.addURLPattern('/api/test');
      interceptor.start();

      $.get(
        'http://localhost:3000/api/test',
        successCallback
      );

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        contentType: 'text/plain',
        responseText: 'awesome response'
      });

      expect(successCallback).toHaveBeenCalled();
      expect(interceptor._applySuccessInterceptors).toHaveBeenCalled();
    });

    it('should call error callback and apply interceptors when request fails', function () {
      var errorSpy = jasmine.createSpy('error');
      spyOn(interceptor, '_applyErrorInterceptors');

      interceptor.addURLPattern('/api/test');
      interceptor.start();

      interceptor._onRequestStart('http://localhost:3000/api/test', {
        error: errorSpy
      });

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 403
      });

      expect(errorSpy).toHaveBeenCalled();
      expect(interceptor._applyErrorInterceptors).toHaveBeenCalled();
    });

    it('should call ajax with no interception added if url is string and options do not have error and success callback', function () {
      var url = 'http://cdb.localhost.lan:3000/api/v3/me';
      var options = {
        data: 'something',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        method: 'PUT'
      };

      interceptor._onRequestStart(url, options);

      expect(interceptor._originalAjax).toHaveBeenCalledWith(url, options);
    });
  });

  describe('._applyErrorInterceptors', function () {
    it('should apply error interceptors if any', function () {
      var xhr = 'xhr';
      var textStatus = 'error';
      var errorThrown = 'errorThrown';

      var errorInterceptorFn = jasmine.createSpy('errorInterceptorFn');
      interceptor.addErrorInterceptor(errorInterceptorFn);

      interceptor._applyErrorInterceptors(xhr, textStatus, errorThrown);

      expect(errorInterceptorFn).toHaveBeenCalledWith(xhr, textStatus, errorThrown);
    });
  });

  describe('._applySuccessInterceptors', function () {
    it('should apply success interceptors if any', function () {
      var response = {};
      var textStatus = 'success';
      var xhr = 'xhr';

      var successInterceptorFn = jasmine.createSpy('successInterceptorFn');
      interceptor.addSuccessInterceptor(successInterceptorFn);

      interceptor._applySuccessInterceptors(response, textStatus, xhr);

      expect(successInterceptorFn).toHaveBeenCalledWith(response, textStatus, xhr);
    });
  });
});
