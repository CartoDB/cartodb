/**
 *  Fetch all query objects (querySchemaModel, queryGeometryModel, queryRowsCollection)
 *  if necessary
 */

module.exports = function (params) {
  if (!params) throw new Error('all query objects are required');
  if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
  if (!params.queryGeometryModel) throw new Error('queryGeometryModel is required');
  if (!params.queryRowsCollection) throw new Error('queryRowsCollection is required');

  function fetchModel (model) {
    return new Promise(function (resolve, reject) {
      var subscribeToFinalStatus = false;

      if (model.shouldFetch()) {
        model.fetch();
        subscribeToFinalStatus = true;
      } else if (!model.isInFinalStatus()) {
        subscribeToFinalStatus = true;
      } else {
        resolve();
      }

      if (subscribeToFinalStatus) {
        model.once('inFinalStatus', function () {
          resolve();
        });
      }
    });
  }

  var schemaModelPromise = fetchModel(params.querySchemaModel);
  var geometryModelPromise = fetchModel(params.queryGeometryModel);

  return Promise.all([schemaModelPromise, geometryModelPromise])
    .then(function () {
      return fetchModel(params.queryRowsCollection); // rows collection depends on schema
    });
};
