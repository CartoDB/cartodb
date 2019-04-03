var $ = require('jquery');
var _ = require('underscore');
var util = require('cdb.core.util');
var WindshaftClient = require('../../../src/windshaft/client');
var Request = require('../../../src/windshaft/request');
var LZMA = require('../../../vendor/lzma');

describe('windshaft/client', function () {
  describe('instantiateMap', function () {
    var ajaxSpy;

    function getRecentCall () {
      const args = ajaxSpy.calls.mostRecent().args[0];
      const url = args.url;

      return {
        url,
        method: args.method,
        path: url.split('?')[0],
        params: url.split('?')[1].split('&'),
        dataType: args.dataType,
        contentType: args.contentType,
        jsonpCallback: args.jsonpCallback,
        cache: args.cache,
        crossOrigin: args.crossOrigin,
        success: args.success,
        error: args.error
      };
    }

    beforeEach(function () {
      ajaxSpy = spyOn($, 'ajax');

      spyOn(util, 'uniqueCallbackName').and.callFake(function () { return 'callbackName'; });

      this.client = new WindshaftClient({
        urlTemplate: 'https://{user}.carto.com:443',
        userName: 'cartojs-test'
      });
    });

    it('should trigger a GET request to instantiate a map', function () {
      var request = new Request({ some: 'json that must be encoded' }, {}, {});
      this.client.instantiateMap(request);

      const { path, method, dataType, jsonpCallback, cache } = getRecentCall();

      expect(path).toEqual('https://cartojs-test.carto.com:443/api/v1/map');
      expect(method).toEqual('GET');
      expect(dataType).toEqual('jsonp');
      expect(jsonpCallback).toMatch('_cdbc_callbackName');
      expect(cache).toEqual(true);
    });

    it('should use the endpoint for named maps', function () {
      var request = new Request({ some: 'json that must be encoded' }, {}, {});
      this.client = new WindshaftClient({
        urlTemplate: 'https://{user}.carto.com:443',
        userName: 'cartojs-test',
        templateName: 'tpl123456789'
      });
      this.client.instantiateMap(request);

      const { path } = getRecentCall();

      expect(path).toEqual('https://cartojs-test.carto.com:443/api/v1/map/named/tpl123456789/jsonp');
    });

    it('should include the given params and handle JSON objects correctly', function () {
      var request = new Request({ some: 'json that must be encoded' }, {
        client: 'client_version',
        filters: { some: 'filters that will be applied' }
      }, {});
      this.client.instantiateMap(request);

      const { path, params, method, dataType, jsonpCallback, cache } = getRecentCall();

      expect(path).toEqual('https://cartojs-test.carto.com:443/api/v1/map');
      expect(params[0]).toEqual('config=%7B%22some%22%3A%22json%20that%20must%20be%20encoded%22%7D');
      expect(params[1]).toEqual('client=client_version');
      expect(params[2]).toEqual('filters=%7B%22some%22%3A%22filters%20that%20will%20be%20applied%22%7D');
      expect(method).toEqual('GET');
      expect(dataType).toEqual('jsonp');
      expect(jsonpCallback).toMatch('_cdbc_callbackName');
      expect(cache).toEqual(true);
    });

    it('should invoke the success callback', function () {
      var successCallback = jasmine.createSpy('successCallback');
      var request = new Request('mapDefinition', {}, { success: successCallback });
      this.client.instantiateMap(request);

      const { success } = getRecentCall();
      success({ layergroupid: '123456789' });

      expect(successCallback).toHaveBeenCalled();
      var dasboardInstance = successCallback.calls.mostRecent().args[0];

      expect(dasboardInstance).toEqual({ layergroupid: '123456789' });
    });

    it('should invoke the error callback if Windshaft returns some errors under a success response code', function () {
      var errorCallback = jasmine.createSpy('errorCallback');
      var request = new Request('mapDefinition', {}, { error: errorCallback });

      this.client.instantiateMap(request);

      var errors = {
        errors: ['the error message'],
        errors_with_context: [
          {
            type: 'unknown',
            message: 'the error message'
          }
        ]
      };

      const { success } = getRecentCall();
      success(errors);

      var callArgs = errorCallback.calls.mostRecent().args;
      expect(callArgs[0][0]).toEqual(jasmine.objectContaining({
        message: 'the error message',
        origin: 'windshaft'
      }));
    });

    it('should invoke the error callback if ajax request goes wrong. If it is not a windshaft error it returns an empty array', function () {
      var errorCallback = jasmine.createSpy('errorCallback');
      var request = new Request('mapDefinition', {}, { error: errorCallback });
      this.client.instantiateMap(request);

      const { error } = getRecentCall();
      error({ responseText: JSON.stringify({ something: 'else' }) });

      var callArgs = errorCallback.calls.mostRecent().args;
      expect(callArgs[0] instanceof Array).toBe(true);
      expect(callArgs[0].length).toBe(0);
    });

    it('should ignore the error callback if request was aborted', function () {
      var errorCallback = jasmine.createSpy('errorCallback');
      var request = new Request('mapDefinition', {}, { error: errorCallback });

      this.client.instantiateMap(request);

      $.ajax.calls.argsFor(0)[0].error({ xhr: { responseText: 'something' } }, 'abort');

      expect(errorCallback).not.toHaveBeenCalled();
    });

    describe('request tracking', function () {
      var successCallback;
      var errorCallback;
      var request;

      beforeEach(function () {
        successCallback = jasmine.createSpy('successCallback');
        errorCallback = jasmine.createSpy('errorCallback');

        request = new Request('mapDefinition', {}, {
          success: successCallback,
          error: errorCallback
        });
      });

      it('should make a request only if the request service allows it', function () {
        expect($.ajax).not.toHaveBeenCalled();

        spyOn(this.client._requestTracker, 'canRequestBePerformed').and.returnValue(true);

        this.client.instantiateMap(request);

        expect($.ajax).toHaveBeenCalled();
      });

      it('should not make a request when the request service does not allow it', function () {
        expect($.ajax).not.toHaveBeenCalled();

        spyOn(this.client._requestTracker, 'canRequestBePerformed').and.returnValue(false);

        this.client.instantiateMap(request);
        expect($.ajax).not.toHaveBeenCalled();
        expect(errorCallback).toHaveBeenCalledWith({});
      });
    });

    xdescribe('HTTP method:', function () {
      it('should use GET to URL with encoded config when the payload is small enough', function (done) {
        var smallPayload = new Array(1933).join('x');
        var request = new Request(smallPayload, { a: 'a sentence' }, {});
        this.client.instantiateMap(request);

        _.defer(function () {
          const { url, method, path, params } = getRecentCall();

          expect(url.length).toBeLessThan(2033);
          expect(path).toEqual('https://cartojs-test.carto.com:443/api/v1/map');
          expect(method).toEqual('GET');
          expect(params[0]).toMatch('^config=');
          expect(params[0]).not.toMatch('^lzma=');
          expect(params[1]).toEqual('a=a%20sentence');
          done();
        });
      });

      it('should use GET with compressed payload when payload is too big', function (done) {
        var mediumPayload = new Array(2033).join('x');
        var request = new Request(mediumPayload, { a: 'a sentence' }, {});
        this.client.instantiateMap(request);

        _.defer(function () {
          const { url, method, path, params } = getRecentCall();

          expect(url.length).toBeLessThan(2033);
          expect(path).toEqual('https://cartojs-test.carto.com:443/api/v1/map');
          expect(method).toEqual('GET');

          expect(params[0]).toMatch('^lzma=');
          expect(params[0]).not.toMatch('^config=');
          expect(params[1]).toEqual('a=a%20sentence');

          done();
        });
      });

      it('should use POST when URL even the compressed payload is too big', function (done) {
        // simulate a compression that generates something BIG
        spyOn(LZMA, 'compress').and.callFake(function (data, level, callback) {
          callback(new Array(2500).join('x'));
        });
        var bigPayload = new Array(2033).join('x');
        var request = new Request(bigPayload, { a: 'a sentence' }, {});
        this.client.instantiateMap(request);

        _.defer(function () {
          const { method, path, params, dataType, contentType, crossOrigin } = getRecentCall();

          expect(path).toEqual('https://cartojs-test.carto.com:443/api/v1/map');
          expect(crossOrigin).toEqual(true);
          expect(method).toEqual('POST');
          expect(dataType).toEqual('json');
          expect(contentType).toEqual('application/json');
          expect(params[0]).toEqual('a=a%20sentence');
          done();
        });
      });
    });

    describe('cancelling previous requests', function () {
      beforeEach(function () {
        this.fakeXHR = jasmine.createSpyObj('fakeXHR', ['abort']);
        $.ajax.and.returnValues(this.fakeXHR, undefined);
      });

      it('should cancel previous requests when using GET requests', function () {
        var errorCallback = jasmine.createSpy('errorCallback');
        var request = new Request({ some: 'json that must be encoded' }, {}, { error: errorCallback });
        this.client.instantiateMap(request);

        expect($.ajax.calls.argsFor(0)[0].method).toEqual('GET');
        expect(this.fakeXHR.abort).not.toHaveBeenCalled();

        this.client.instantiateMap(request);

        expect(this.fakeXHR.abort).toHaveBeenCalled();

        expect(errorCallback).not.toHaveBeenCalled();
      });

      it('should cancel previous requests when using POST requests', function (done) {
        // simulate a compression that generates something BIG
        spyOn(LZMA, 'compress').and.callFake(function (data, level, callback) {
          callback(new Array(2500).join('x'));
        });
        var request = new Request({ something: new Array(3000).join('x') }, {}, {});
        this.client.instantiateMap(request);

        _.defer(function () {
          expect($.ajax.calls.argsFor(0)[0].method).toEqual('POST');
          expect(this.fakeXHR.abort).not.toHaveBeenCalled();

          this.client.instantiateMap(request);

          expect(this.fakeXHR.abort).toHaveBeenCalled();

          done();
        }.bind(this));
      });
    });
  });
});
