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
      if (model.shouldFetch()) {
        model.fetch({
          success: function () {
            resolve();
          },
          error: function (model, response) {
            reject(response);
          }
        });
      } else if (!model.isDone()) {
        model.once('done', resolve);
      } else {
        resolve();
      }
    });
  }

  var schemaModelPromise = fetchModel(params.querySchemaModel, 'schema');
  var geometryModelPromise = fetchModel(params.queryGeometryModel, 'geometry');

  return Promise.all([schemaModelPromise, geometryModelPromise])
    .then(function () {
      return fetchModel(params.queryRowsCollection, 'rowsCollection'); // rows collection depends on schema
    });
};
