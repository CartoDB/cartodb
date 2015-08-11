var Poller = require('../../../../../javascripts/cartodb/common/background_polling/models/poller');

describe('Poller', function() {

  var model;

  beforeEach(function() {
    model = new Backbone.Model();
    jasmine.clock().install();
    spyOn(model, 'fetch');
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  describe('.start', function() {

    it('should start fetching periodically after the specified number of seconds', function() {
      var poller = new Poller(model, { interval: 100 });
      poller.start();

      expect(model.fetch).not.toHaveBeenCalled();

      jasmine.clock().tick(101);

      expect(model.fetch.calls.count()).toEqual(1);

      model.fetch.calls.mostRecent().args[0].success();

      jasmine.clock().tick(100);

      expect(model.fetch.calls.count()).toEqual(2);
    });

    it('should not trigger new requests if previous request haven\'t succeeded', function() {
      var poller = new Poller(model, { interval: 100 });
      poller.start();

      jasmine.clock().tick(101);

      expect(model.fetch.calls.count()).toEqual(1);

      // First request has been received
      model.fetch.calls.mostRecent().args[0].success();

      // 2000 more millisecs are gone
      jasmine.clock().tick(2000);

      // Only one more request has been triggered
      expect(model.fetch.calls.count()).toEqual(2);
    });

    it('should not try to poll if already polling', function() {
      var poller = new Poller(model, { interval: 100 });
      poller.start();
      poller.start();

      expect(model.fetch).not.toHaveBeenCalled();

      jasmine.clock().tick(101);

      expect(model.fetch.calls.count()).toEqual(1);
    });

    it('should stop polling when the condition is satisfied', function() {

      // This satisfies the condition
      model.set({ 'something': 'wadus' });

      var poller = new Poller(model, {
        interval: 100,
        condition: function(model) {
          return model.get('something') === 'wadus';
        }
      });

      poller.start();

      expect(model.fetch).not.toHaveBeenCalled();

      jasmine.clock().tick(101);

      // Fetch has been called
      expect(model.fetch.calls.count()).toEqual(1);

      // Fetch request suceeds
      model.fetch.calls.mostRecent().args[0].success();

      jasmine.clock().tick(101);

      // Fetch was only called the first time (condition was met afterwards)
      expect(model.fetch.calls.count()).toEqual(1);
    });
  });

  describe('.stop', function() {

    it('should stop polling', function() {
      var poller = new Poller(model, { interval: 100 });
      poller.start();
      poller.stop();

      expect(model.fetch).not.toHaveBeenCalled();

      jasmine.clock().tick(1000);

      expect(model.fetch).not.toHaveBeenCalled();
    });
  });
});