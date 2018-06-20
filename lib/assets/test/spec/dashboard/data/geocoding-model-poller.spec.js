const Backbone = require('backbone');
const GeocodingModelPoller = require('dashboard/data/background-polling/geocoding-model-poller');

describe('GeocodingModelPoller', function () {
  var originalFetch;

  beforeEach(function () {
    var Model = Backbone.Model.extend({
      url: '/hello'
    });
    this.model = new Model();
    this.model.hasFailed = function () { return false; };
    this.model.hasCompleted = function () { return false; };
    this.model.sync = function (a, b, opts) {
      opts.success();
    };
    originalFetch = this.model.fetch;
    spyOn(this.model, 'fetch').and.callThrough();

    this.poller = new GeocodingModelPoller(this.model);

    jasmine.clock().install();
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  it('should stop polling when geocoding has failed', function () {
    this.model.hasFailed = function () { return true; };

    this.poller.start();

    jasmine.clock().tick(4000);

    expect(this.model.fetch.calls.count()).toBe(1);
  });

  it('should stop polling when geocoding has completed', function () {
    this.model.hasCompleted = function () { return true; };

    this.poller.start();

    jasmine.clock().tick(4000);

    expect(this.model.fetch.calls.count()).toBe(1);
  });

  it('should trigger a change event if an error occurs', function () {
    this.model.fetch = originalFetch;
    spyOn(this.model, 'fetch');

    var onErrorCallback = jasmine.createSpy('error');
    this.model.bind('change', onErrorCallback);

    this.poller.start();

    jasmine.clock().tick(2001);

    this.model.fetch.calls.mostRecent().args[0].error();

    expect(onErrorCallback).toHaveBeenCalled();
  });
});
