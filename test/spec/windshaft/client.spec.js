var $ = require('jquery');
var _ = require('underscore');
var util = require('cdb.core.util');
var WindshaftClient = require('../../../src/windshaft/client');
var LZMA = require('lzma');

describe('windshaft/client', function () {
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
        userName: 'rambo'
      });
    });

    it('should trigger a GET request to instantiate a map', function () {
      this.client.instantiateMap({
        mapDefinition: { some: 'json that must be encoded' }
      });

      var url = this.ajaxParams.url.split('?')[0];

      expect(url).toEqual('https://rambo.example.com:443/api/v1/map');
      expect(this.ajaxParams.method).toEqual('GET');
      expect(this.ajaxParams.dataType).toEqual('jsonp');
      expect(this.ajaxParams.jsonpCallback).toMatch('_cdbc_callbackName');
      expect(this.ajaxParams.cache).toEqual(true);
    });

    it('should use the endpoint for named maps', function () {
      this.client = new WindshaftClient({
        urlTemplate: 'https://{user}.example.com:443',
        userName: 'rambo',
        templateName: 'tpl123456789'
      });

      this.client.instantiateMap({
        mapDefinition: { some: 'json that must be encoded' }
      });

      var url = this.ajaxParams.url.split('?')[0];

      expect(url).toEqual('https://rambo.example.com:443/api/v1/map/named/tpl123456789/jsonp');
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

      expect(url).toEqual('https://rambo.example.com:443/api/v1/map');
      expect(params[0]).toEqual('config=%7B%22some%22%3A%22json%20that%20must%20be%20encoded%22%7D');
      expect(params[1]).toEqual('stat_tag=stat_tag');
      expect(params[2]).toEqual('filters=%7B%22some%22%3A%22filters%20that%20will%20be%20applied%22%7D');
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

    describe('GET or POST', function () {
      beforeEach(function () {
        this.client = new WindshaftClient({
          urlTemplate: 'https://{user}.carto.com:443',
          userName: 'rambo'
        });
      });

      it('should use GET to URL with encoded config', function (done) {
        this.client.instantiateMap({
          mapDefinition: { something: new Array(1933).join('x') },
          params: {
            a: 'a sentence'
          }
        });

        _.defer(function () {
          var url = this.ajaxParams.url.split('?')[0];
          var params = this.ajaxParams.url.split('?')[1].split('&');

          expect(this.ajaxParams.url.length).toBeLessThan(2033);
          expect(url).toEqual('https://rambo.carto.com:443/api/v1/map');
          expect(this.ajaxParams.method).toEqual('GET');
          expect(params[0]).toMatch('^config=');
          expect(params[0]).not.toMatch('^lzma=');
          expect(params[1]).toEqual('a=a%20sentence');

          done();
        }.bind(this));
      });

      it('should use GET to URL with compressed config', function (done) {
        this.client.instantiateMap({
          mapDefinition: { something: new Array(1943).join('x') },
          params: {
            a: 'a sentence'
          }
        });

        _.defer(function () {
          var url = this.ajaxParams.url.split('?')[0];
          var params = this.ajaxParams.url.split('?')[1].split('&');

          expect(this.ajaxParams.url.length).toBeLessThan(2033);
          expect(url).toEqual('https://rambo.carto.com:443/api/v1/map');
          expect(this.ajaxParams.method).toEqual('GET');
          expect(params[0]).toMatch('^lzma=');
          expect(params[0]).not.toMatch('^config=');
          expect(params[1]).toEqual('a=a%20sentence');

          done();
        }.bind(this));
      });

      it('should use POST when URL is too big', function (done) {
        // simulate a compression that generates something BIG
        spyOn(LZMA, 'compress').and.callFake(function (data, level, callback) {
          callback(new Array(2500).join('x'));
        });

        this.client.instantiateMap({
          mapDefinition: { something: new Array(2000).join('x') },
          params: {
            a: 'a sentence'
          }
        });

        _.defer(function () {
          var url = this.ajaxParams.url.split('?')[0];
          var params = this.ajaxParams.url.split('?')[1].split('&');

          expect(url).toEqual('https://rambo.carto.com:443/api/v1/map');
          expect(this.ajaxParams.crossOrigin).toEqual(true);
          expect(this.ajaxParams.method).toEqual('POST');
          expect(this.ajaxParams.dataType).toEqual('json');
          expect(this.ajaxParams.contentType).toEqual('application/json');
          expect(params[0]).toEqual('a=a%20sentence');
          done();
        }.bind(this));
      });
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

      it('should cancel previous requests when using POST requests', function (done) {
        // simulate a compression that generates something BIG
        spyOn(LZMA, 'compress').and.callFake(function (data, level, callback) {
          callback(new Array(2500).join('x'));
        });

        this.client.instantiateMap({
          mapDefinition: { something: new Array(3000).join('x') }
        });

        _.defer(function () {
          expect($.ajax.calls.argsFor(0)[0].method).toEqual('POST');
          expect(this.fakeXHR.abort).not.toHaveBeenCalled();

          this.client.instantiateMap({
            mapDefinition: { something: new Array(3000).join('x') }
          });

          expect(this.fakeXHR.abort).toHaveBeenCalled();

          done();
        }.bind(this));
      });
    });
  });
});
