var QueryGeometryModel = require('builder/data/query-geometry-model');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');

function getQueryGeometryModelFixture (opts) {
  opts = opts || {};
  var configModel = opts.configModel || getConfigModelFixture();
  var initialStatus = opts.initialStatus || 'unfetched';
  var query = opts.query || 'SELECT * FROM wadus';

  var model = new QueryGeometryModel({
    ready: true,
    status: initialStatus,
    query: query
  }, { configModel: configModel });

  model.hasValueAsync = function () {};

  return model;
}

module.exports = getQueryGeometryModelFixture;
