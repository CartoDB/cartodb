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
        mapDefinition: { some: 'json that must be encoded' },
        statTag: 'stat_tag',
        filters: { some: 'filters that will be applied' }
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

    it('should include the api_key in the URL if present', function () {
      this.client.instantiateMap({
        mapDefinition: { some: 'json that must be encoded' },
        statTag: 'stat_tag',
        apiKey: 'api_key',
        filters: { some: 'filters that will be applied' }
      });

      var params = this.ajaxParams.url.split('?')[1].split('&');

      expect(params.indexOf('api_key=api_key')).toBeTruthy();
    });

    it('should throw an error if api_key is provide but https is not being used', function () {
      this.client = new WindshaftClient({
        urlTemplate: 'http://{user}.example.com',
        userName: 'rambo',
        endpoint: 'api/v1'
      });

      expect(function () {
        this.client.instantiateMap({
          mapDefinition: { some: 'json that must be encoded' },
          apiKey: 'api_key'
        });
      }.bind(this)).toThrowError('Authenticated requests can only be made via https');
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

      this.ajaxParams.success({
        errors: [ 'something went wrong!' ]
      });

      expect(errorCallback).toHaveBeenCalledWith('something went wrong!');
    });

    it('should invoke the error callback if ajax request goes wrong', function () {
      var errorCallback = jasmine.createSpy('errorCallback');

      this.client.instantiateMap({
        mapDefinition: 'mapDefinition',
        filters: {},
        error: errorCallback
      });

      this.ajaxParams.error({ responseText: 'something went wrong!' });

      expect(errorCallback).toHaveBeenCalledWith('Unknown error');
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
        statTag: 'stat_tag',
        filters: { some: 'filters that will be applied' }
      });

      var url = this.ajaxParams.url.split('?')[0];
      var params = this.ajaxParams.url.split('?')[1].split('&');

      expect(url).toEqual('https://rambo.example.com:443/api/v1');
      expect(params[0]).toEqual('stat_tag=stat_tag');
      expect(params[1]).toEqual('filters=%7B%22some%22%3A%22filters%20that%20will%20be%20applied%22%7D');
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

      var mapDefinition = { key: '' };
      for (var i = 0; i < 3000; i++) {
        mapDefinition.key += 'x';
      }

      this.client.instantiateMap({
        mapDefinition: mapDefinition,
        statTag: 'stat_tag',
        filters: { some: 'filters that will be applied' }
      });

      var url = this.ajaxParams.url.split('?')[0];
      var params = this.ajaxParams.url.split('?')[1].split('&');

      expect(url).toEqual('https://rambo.example.com:443/api/v1');
      expect(params[0]).toEqual('stat_tag=stat_tag');
      expect(params[1]).toEqual('filters=%7B%22some%22%3A%22filters%20that%20will%20be%20applied%22%7D');
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
        mapDefinition: { some: 'json that must be encoded' },
        filters: { some: 'filters that will be applied' }
      });

      expect(this.ajaxParams.method).toEqual('GET');
    });
  });
});
