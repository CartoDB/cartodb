const Backbone = require('backbone');
const Poller = require('dashboard/data/background-polling/poller');

describe('Poller', function () {
  var model, originalSync, originalFetch;

  beforeEach(function () {
    var Model = Backbone.Model.extend({
      url: '/hello'
    });
    model = new Model();
    originalSync = model.sync;
    model.sync = function (a, b, opts) {
      opts.success();
    };

    jasmine.clock().install();
    originalFetch = model.fetch;
    spyOn(model, 'fetch').and.callThrough();
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('.start', function () {
    it('should start fetching periodically after the specified number of seconds', function () {
      var poller = new Poller(model, { interval: 100 });
      poller.start();

      expect(model.fetch).not.toHaveBeenCalled();

      jasmine.clock().tick(100);

      expect(model.fetch.calls.count()).toEqual(1);

      jasmine.clock().tick(100);

      expect(model.fetch.calls.count()).toEqual(2);
    });

    it('should auto start fetching if autoStart option is true', function () {
      var poller = new Poller(model, { // eslint-disable-line no-unused-vars
        interval: 100,
        autoStart: true
      });

      expect(model.fetch).not.toHaveBeenCalled();

      jasmine.clock().tick(100);

      expect(model.fetch.calls.count()).toEqual(1);

      jasmine.clock().tick(100);

      expect(model.fetch.calls.count()).toEqual(2);
    });

    it('should not trigger new requests if previous request haven\'t succeeded', function () {
      model.sync = originalSync;

      var poller = new Poller(model, { interval: 100 });
      poller.start();

      jasmine.clock().tick(100);

      expect(model.fetch.calls.count()).toEqual(1);

      // First request has been received
      model.fetch.calls.mostRecent().args[0].success();

      // 2000 more millisecs are gone
      jasmine.clock().tick(2000);

      // Only one more request has been triggered
      expect(model.fetch.calls.count()).toEqual(2);
    });

    it('should not try to poll if already polling', function () {
      var poller = new Poller(model, { interval: 100 });
      poller.start();
      poller.start();

      expect(model.fetch).not.toHaveBeenCalled();

      jasmine.clock().tick(100);

      expect(model.fetch.calls.count()).toEqual(1);
    });

    it('should stop polling when the condition is satisfied', function () {
      // This satisfies the condition
      model.set({ 'something': 'wadus' });

      var poller = new Poller(model, {
        interval: 100,
        stopWhen: function (model) {
          return model.get('something') === 'wadus';
        }
      });

      poller.start();

      expect(model.fetch).not.toHaveBeenCalled();

      jasmine.clock().tick(100);

      // Fetch has been called
      expect(model.fetch.calls.count()).toEqual(1);

      jasmine.clock().tick(100);

      // Fetch was only called the first time (condition was met afterwards)
      expect(model.fetch.calls.count()).toEqual(1);
    });

    it('should use the given function to determine the interval', function () {
      model.sync = function (a, b, opts) {
        opts.success();
      };

      var poller = new Poller(model, { // eslint-disable-line no-unused-vars
        interval: function (n) {
          if (n === 0) {
            return 100;
          } else {
            return 1;
          }
        },
        autoStart: true
      });

      expect(model.fetch).not.toHaveBeenCalled();

      jasmine.clock().tick(100);

      expect(model.fetch.calls.count()).toEqual(1);

      jasmine.clock().tick(1);

      expect(model.fetch.calls.count()).toEqual(2);
    });

    it('should invoke the error callback if the request fails', function () {
      model.fetch = originalFetch;
      spyOn(model, 'fetch');

      var errorCallback = jasmine.createSpy('error');

      var poller = new Poller(model, {
        interval: 100,
        error: errorCallback
      });

      poller.start();

      jasmine.clock().tick(100);

      model.fetch.calls.mostRecent().args[0].error();

      expect(errorCallback).toHaveBeenCalledWith(model);
    });
  });

  describe('.stop', function () {
    it('should stop polling', function () {
      var poller = new Poller(model, { interval: 100 });
      poller.start();
      poller.stop();

      expect(model.fetch).not.toHaveBeenCalled();

      jasmine.clock().tick(1000);

      expect(model.fetch).not.toHaveBeenCalled();
    });
  });
});
