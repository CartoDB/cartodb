var Loader = require('../../../src/core/loader');
var createVis = require('../../../src/api/create-vis');
var fakeVizJSON = require('./fake-vizjson');

describe('src/api/create-vis', function () {
  it('should throw errors if required params are not set', function () {
    expect(function () {
      createVis();
    }).toThrowError('a DOM element must be provided');

    expect(function () {
      createVis('something');
    }).toThrowError('a vizjson URL or object must be provided');

    expect(function () {
      createVis('domId', 'http://example.com/vizjson');
    }).not.toThrowError();
  });

  it('should load the vizjson file from a URL', function (done) {
    spyOn(Loader, 'get');
    var promise = createVis('domId', 'http://example.com/vizjson');

    // Simulate a successful response from Loader.get
    var loaderCallback = Loader.get.calls.mostRecent().args[1];
    loaderCallback(fakeVizJSON);

    promise.done(function (vis, layers) {
      expect(vis).toBeDefined();
      expect(layers).toBeDefined();
      done();
    });
  });

  it('should use the given vizjson object', function () {
    spyOn(Loader, 'get');
    var promise = createVis('domId', fakeVizJSON);
    expect(Loader.get).not.toHaveBeenCalled();
    promise.done(function (vis, layers) {
      expect(vis).toBeDefined();
      expect(layers).toBeDefined();
    });
  });
});

