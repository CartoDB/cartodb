var QueryRowsCollection = require('builder/data/query-rows-collection');
var getConfigModelFixture = require('fixtures/builder/config-model.fixture.js');

function getQueryRowsCollectionFixture (opts) {
  opts = opts || {};
  if (!opts.querySchemaModel) {
    throw new Error('querySchemaModel is required for QueryRowsCollection fixture.');
  }
  var configModel = opts.configModel || getConfigModelFixture();
  var initialStatus = opts.initialStatus || 'unfetched';

  var queryRowsCollection = new QueryRowsCollection({}, {
    configModel: configModel,
    querySchemaModel: opts.querySchemaModel
  });
  queryRowsCollection.statusModel.set('status', initialStatus, { silent: true });

  return queryRowsCollection;
}

module.exports = getQueryRowsCollectionFixture;
