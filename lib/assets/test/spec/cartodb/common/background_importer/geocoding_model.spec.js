var cdb = require('cartodb.js-v3');
var GeocodingModel = require('../../../../../javascripts/cartodb/common/background_polling/models/geocoding_model');

describe('common/background_polling/geocoding_model', function() {
  beforeEach(function() {
    var user = new cdb.admin.User({ username: 'paco' });
    GeocodingModel.prototype.sync = function(a,b,opts) {
      opts.success();
    };
    this.model = new GeocodingModel(null, { user: user });
    spyOn(this.model, 'bind').and.callThrough();
  });

  it('should not start polling when option is not enabled', function() {
    spyOn(this.model, 'fetch');
    this.model.options.startPollingAutomatically = false;
    this.model.set('id', 1);
    this.model.initialize();
    expect(this.model.fetch).not.toHaveBeenCalled();
  });

  it('should save model when it is new', function() {
    spyOn(this.model, 'save');
    this.model._checkModel();
    expect(this.model.save).toHaveBeenCalled();
  });

  it('should have several change binds', function() {
    this.model._initBinds();
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:id');
  });

  describe('.pollCheck', function() {

    beforeEach(function() {
      jasmine.clock().install();
      spyOn(this.model, 'fetch');
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('should start polling', function() {
      spyOn(this.model.poller, 'start');

      this.model.pollCheck();

      expect(this.model.poller.start).toHaveBeenCalled();
    });
  });

  describe('.destroyCheck', function() {

    beforeEach(function() {
      jasmine.clock().install();
      spyOn(this.model, 'fetch');
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('should stop polling', function() {
      spyOn(this.model.poller, 'stop');

      this.model.pollCheck();
      this.model.destroyCheck();

      expect(this.model.poller.stop).toHaveBeenCalled();
    });
  });

  it('should know when geocoding has finished', function() {
    expect(this.model.hasCompleted()).toBeFalsy();
    this.model.set('state', 'finished');
    expect(this.model.hasCompleted()).toBeTruthy();
    this.model.set('state', 'geocoding');
    expect(this.model.hasCompleted()).toBeFalsy();
  });

  it('should know when geocoding has failed', function() {
    expect(this.model.hasFailed()).toBeFalsy();
    this.model.set('state', 'failed');
    expect(this.model.hasFailed()).toBeTruthy();
    this.model.set('state', 'geocoding');
    expect(this.model.hasFailed()).toBeFalsy();
    this.model.set('state', 'reset');
    expect(this.model.hasFailed()).toBeTruthy();
    this.model.set('state', 'cancelled');
    expect(this.model.hasFailed()).toBeTruthy();
  });

});
