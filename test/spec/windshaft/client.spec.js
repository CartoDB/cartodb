var $ = require('jquery');
var util = require('cdb.core.util');
var WindshaftClient = require('../../../src/windshaft/client');

describe('windshaft/client', function () {
  it('should throw an error if required options are not passed to the constructor', function () {
    expect(function () {
      new WindshaftClient({}, ['urlTemplate', 'userName', 'endpoint']); // eslint-disable-line
    }).toThrowError('WindshaftClient could not be initialized. The following options are missing: urlTemplate, userName, endpoint');
  });

  describe('#instantiateMap', function () {
    beforeEach(function () {
      spyOn($, 'ajax').and.callFake(function (params) {
        this.ajaxParams = params;
      }.bind(this));

      spyOn(util, 'uniqueCallbackName').and.callFake(function () {
        return 'callbackName';
      });

      this.client = new WindshaftClient({
        urlTemplate: 'https://{user}.example.com:443',
        userName: 'rambo',
        endpoint: 'api/v1'
      });
    });

    it('should trigger a GET request to instantiate a map', function () {
      this.client.instantiateMap({
        mapDefinition: { some: 'json that must be encoded' }
      });

      var url = this.ajaxParams.url.split('?')[0];

      expect(url).toEqual('https://rambo.example.com:443/api/v1');
      expect(this.ajaxParams.method).toEqual('GET');
      expect(this.ajaxParams.dataType).toEqual('jsonp');
      expect(this.ajaxParams.jsonpCallback).toMatch('_cdbc_callbackName');
      expect(this.ajaxParams.cache).toEqual(true);
    });

    it('should include the given params and handle JSON objects correctly', function () {
      this.client.instantiateMap({
        mapDefinition: { some: 'json that must be encoded' },
        params: {
          stat_tag: 'stat_tag',
          filters: { some: 'filters that will be applied' }
        }
      });

      var url = this.ajaxParams.url.split('?')[0];
      var params = this.ajaxParams.url.split('?')[1].split('&');

      expect(url).toEqual('https://rambo.example.com:443/api/v1');
      expect(params[0]).toEqual('stat_tag=stat_tag');
      expect(params[1]).toEqual('filters=%7B%22some%22%3A%22filters%20that%20will%20be%20applied%22%7D');
      expect(params[2]).toEqual('config=%7B%22some%22%3A%22json%20that%20must%20be%20encoded%22%7D');
      expect(this.ajaxParams.method).toEqual('GET');
      expect(this.ajaxParams.dataType).toEqual('jsonp');
      expect(this.ajaxParams.jsonpCallback).toMatch('_cdbc_callbackName');
      expect(this.ajaxParams.cache).toEqual(true);
    });

    it('should invoke the success callback', function () {
      var successCallback = jasmine.createSpy('successCallback');

      this.client.instantiateMap({
        mapDefinition: 'mapDefinition',
        filters: {},
        success: successCallback
      });

      this.ajaxParams.success({ layergroupid: '123456789' });

      expect(successCallback).toHaveBeenCalled();
      var dasboardInstance = successCallback.calls.mostRecent().args[0];

      expect(dasboardInstance).toEqual({ layergroupid: '123456789' });
    });

    it('should invoke the error callback if Windshaft returns some errors', function () {
      var errorCallback = jasmine.createSpy('errorCallback');

      this.client.instantiateMap({
        mapDefinition: 'mapDefinition',
        filters: {},
        error: errorCallback
      });

      var errors = {
        errors: [ 'the error message' ],
        errors_with_context: {
          type: 'unknown',
          message: 'the error message'
        }
      };

      this.ajaxParams.success(errors);

      expect(errorCallback).toHaveBeenCalledWith(errors);
    });

    it('should invoke the error callback if ajax request goes wrong', function () {
      var errorCallback = jasmine.createSpy('errorCallback');

      this.client.instantiateMap({
        mapDefinition: 'mapDefinition',
        filters: {},
        error: errorCallback
      });

      this.ajaxParams.error({ responseText: JSON.stringify({ something: 'else' }) });

      expect(errorCallback).toHaveBeenCalledWith({ something: 'else' });
    });

    it('should ignore the error callback if request was aborted', function () {
      var errorCallback = jasmine.createSpy('errorCallback');

      this.client.instantiateMap({
        mapDefinition: 'mapDefinition',
        filters: {},
        error: errorCallback
      });

      $.ajax.calls.argsFor(0)[0].error({ xhr: { responseText: 'something' } }, 'abort');

      expect(errorCallback).not.toHaveBeenCalled();
    });

    it('should use POST if forceCors is true', function () {
      spyOn(util, 'isCORSSupported').and.returnValue(true);

      this.client = new WindshaftClient({
        urlTemplate: 'https://{user}.example.com:443',
        userName: 'rambo',
        endpoint: 'api/v1',
        forceCors: true
      });

      this.client.instantiateMap({
        mapDefinition: { some: 'json that must be encoded' },
        params: {
          a: 'b'
        }
      });

      var url = this.ajaxParams.url.split('?')[0];
      var params = this.ajaxParams.url.split('?')[1].split('&');

      expect(url).toEqual('https://rambo.example.com:443/api/v1');
      expect(params[0]).toEqual('a=b');
      expect(this.ajaxParams.crossOrigin).toEqual(true);
      expect(this.ajaxParams.method).toEqual('POST');
      expect(this.ajaxParams.dataType).toEqual('json');
      expect(this.ajaxParams.contentType).toEqual('application/json');
    });

    it('should use POST if payload is too big to be sent as a URL param', function () {
      spyOn(util, 'isCORSSupported').and.returnValue(true);

      this.client = new WindshaftClient({
        urlTemplate: 'https://{user}.example.com:443',
        userName: 'rambo',
        endpoint: 'api/v1',
        forceCors: false
      });

      this.client.instantiateMap({
        mapDefinition: { something: new Array(3000).join('x') },
        params: {
          a: 'b'
        }
      });

      var url = this.ajaxParams.url.split('?')[0];
      var params = this.ajaxParams.url.split('?')[1].split('&');

      expect(url).toEqual('https://rambo.example.com:443/api/v1');
      expect(params[0]).toEqual('a=b');
      expect(this.ajaxParams.crossOrigin).toEqual(true);
      expect(this.ajaxParams.method).toEqual('POST');
      expect(this.ajaxParams.dataType).toEqual('json');
      expect(this.ajaxParams.contentType).toEqual('application/json');
    });

    it('should NOT use POST if forceCors is true but cors is not supported', function () {
      spyOn(util, 'isCORSSupported').and.returnValue(false);

      this.client = new WindshaftClient({
        urlTemplate: 'https://{user}.example.com:443',
        userName: 'rambo',
        endpoint: 'api/v1',
        forceCors: true
      });

      this.client.instantiateMap({
        mapDefinition: { some: 'json that must be encoded' }
      });

      expect(this.ajaxParams.method).toEqual('GET');
    });

    describe('cancelling previous requests', function () {
      beforeEach(function () {
        this.fakeXHR = jasmine.createSpyObj('fakeXHR', [ 'abort' ]);
        $.ajax.and.returnValues(this.fakeXHR, undefined);
      });

      it('should cancel previous requests when using GET requests', function () {
        var errorCallback = jasmine.createSpy('errorCallback');

        this.client.instantiateMap({
          mapDefinition: { some: 'json that must be encoded' },
          error: errorCallback
        });

        expect($.ajax.calls.argsFor(0)[0].method).toEqual('GET');
        expect(this.fakeXHR.abort).not.toHaveBeenCalled();

        this.client.instantiateMap({
          mapDefinition: { some: 'json that must be encoded' }
        });

        expect(this.fakeXHR.abort).toHaveBeenCalled();

        expect(errorCallback).not.toHaveBeenCalled();
      });

      it('should cancel previous requests when using POST requests', function () {
        this.client.instantiateMap({
          mapDefinition: { something: new Array(3000).join('x') }
        });

        expect($.ajax.calls.argsFor(0)[0].method).toEqual('POST');
        expect(this.fakeXHR.abort).not.toHaveBeenCalled();

        this.client.instantiateMap({
          mapDefinition: { something: new Array(3000).join('x') }
        });

        expect(this.fakeXHR.abort).toHaveBeenCalled();
      });
    });
  });
});
