var _ = require('underscore');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');

function getQueryGeometryModelFixture (opts) {
  opts = opts || {};
  var configModel = opts.configModel || getConfigModelFixture();
  var initialStatus = opts.initialStatus || 'unfetched';
  var query = opts.query || 'SELECT * FROM wadus';
  var mockPromises = _.isFinite(opts.mockPromises)
    ? opts.mockPromises
    : true;

  var model = new QueryGeometryModel({
    ready: true,
    status: initialStatus,
    query: query
  }, { configModel: configModel });

  // Promise handling
  var resolveHasValueFn = null;

  model.resetPromises = function () {
    if (!mockPromises) {
      throw new Error('mockPromises has been set to false. Calling this method will have no effect.');
    }
    resolveHasValueFn = null;
  };

  model.resolveHasValueAsync = function (value) {
    if (!mockPromises) {
      throw new Error('mockPromises has been set to false. Calling this method will have no effect.');
    }
    if (resolveHasValueFn) {
      resolveHasValueFn(value);
    }
  };

  if (mockPromises) {
    spyOn(model, 'hasValueAsync').and.callFake(function () {
      return new Promise(function (resolve, reject) {
        resolveHasValueFn = resolve;
      });
    });
  }
}

module.exports = getQueryGeometryModelFixture;
