
describe('backbone.cachedSync', function() {
  var backboneSync, model, sync;
  beforeEach(function() {
    sync = Backbone.cachedSync('test-namespace');

    backboneSync = Backbone.sync;
    Backbone.sync = function(method, model, options) {
      options.success(null, 'success', {
        responseText: "['testresponse']"
      });
    }

    model = new Backbone.Model();
    model.url = function() { return 'test-url' };
  });

  afterEach(function() {
    Backbone.sync = backboneSync;
  });

  it ('should store in the cache', function(done) {
    sync('read', model, {
      success: function() {
        sync.cache.getItem('cdb-cache/test-namespace/test-url', function(val) {

          expect(val).toEqual("['testresponse']");
          done();
        })
      }
    })
  });



});
