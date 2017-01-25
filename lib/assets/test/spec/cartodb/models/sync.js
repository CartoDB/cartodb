describe('backbone.cachedSync', function () {
  var backboneSync;
  var model;
  var sync;
  var store = {};

  beforeAll(function () {
    spyOn(localStorage, 'getItem').and.callFake(function (key) {
      return store[key];
    });
    spyOn(localStorage, 'removeItem').and.callFake(function (key) {
      delete store[key];
    });
    spyOn(localStorage, 'setItem').and.callFake(function (key, value) {
      store[key] = value + '';
      return store[key];
    });
    spyOn(localStorage, 'clear').and.callFake(function () {
      store = {};
    });
  });

  beforeEach(function () {
    store = {};

    window.user_data = {
      username: 'testuser',
      twitter: { enabled: true },
      mailchimp: { enabled: false }
    };

    sync = Backbone.cachedSync('test-namespace');
    backboneSync = Backbone.sync;

    Backbone.sync = function (method, model, options) {
      setTimeout(function () {
        var v = ['testresponse'];
        options.success(v, 'success', {
          responseText: JSON.stringify(v)
        });
      }, 100);
    };

    model = new Backbone.Model();
    model.url = function () { return 'test-url'; };
    //window.localStorage = window.localStorage || {};
  });

  afterEach(function () {
    Backbone.sync = backboneSync;
  });

  it('should store in the cache', function (done) {
    sync('read', model, {
      success: function () {
        var val = store['cdb-cache/test-namespace-testuser/test-url'];
        expect(val).toEqual('["testresponse"]');
        done();
      }
    });
  });

  it('should invalidate by surrogate key', function () {
    sync('read', model, {});
    Backbone.cachedSync.invalidateSurrogateKeys('test-namespace');
    expect(_.keys(store).length).toEqual(0);
  });

  it('should return the value from cache if cached and then the new', function (done) {
    store['cdb-cache/test-namespace-testuser/test-url'] = '["cached"]';
    var count = 0;
    sync('read', model, {
      success: function (val) {
        if (count === 0) {
          expect(val).toEqual(['cached']);
          ++count;
        } else {
          expect(val, store['cdb-cache/test-namespace-testuser/test-url']);
          expect(val).toEqual(['testresponse']);
          done();
        }
      }
    });
  });
});
