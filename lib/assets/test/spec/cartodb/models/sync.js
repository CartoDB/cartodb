
describe('backbone.cachedSync', function() {
  var backboneSync, model, sync, store;
  beforeEach(function() {
    store = {}
    sync = Backbone.cachedSync('test-namespace');

    backboneSync = Backbone.sync;
    Backbone.sync = function(method, model, options) {
      setTimeout(function() {
        var v = ['testresponse'];
        options.success(v, 'success', {
          responseText: JSON.stringify(v)
        });
      }, 100);
    }

    model = new Backbone.Model();
    model.url = function() { return 'test-url' };
    //window.localStorage = window.localStorage || {};
    spyOn(localStorage, 'getItem').and.callFake(function (key) {
      return store[key];
    });
    spyOn(localStorage, 'setItem').and.callFake(function (key, value) {
      return store[key] = value + '';
    });
    spyOn(localStorage, 'clear').and.callFake(function () {
        store = {};
    });
  });

  afterEach(function() {
    Backbone.sync = backboneSync;
  });

  it ('should store in the cache', function(done) {
    sync('read', model, {
      success: function() {
        var val = store['cdb-cache/test-namespace/test-url'];
        expect(val).toEqual("[\"testresponse\"]");
        done();
      }
    })
  });

  it ('should return the value from cache if cached and then the new', function(done) {
    store['cdb-cache/test-namespace/test-url'] = "[\"cached\"]";
    var count = 0;
    sync('read', model, {
      success: function(val) {
        if (count === 0) {
          expect(val).toEqual(['cached']);
          ++count;
        } else {
          expect(val, store['cdb-cache/test-namespace/test-url']);
          expect(val).toEqual(['testresponse']);
          done();
        }
      }
    })
  });



});
