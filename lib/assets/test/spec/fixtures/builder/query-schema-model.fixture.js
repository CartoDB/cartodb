var QuerySchemaModel = require('builder/data/query-schema-model');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');

function getQuerySchemaModelFixture (opts) {
  opts = opts || {};
  var configModel = opts.configModel || getConfigModelFixture();
  var initialStatus = opts.initialStatus || 'initial';
  var query = opts.hasOwnProperty('query')
    ? opts.query
    : 'SELECT * FROM wadus';

  return new QuerySchemaModel({
    ready: true,
    status: initialStatus,
    query: query
  }, { configModel: configModel });
}

module.exports = getQuerySchemaModelFixture;
