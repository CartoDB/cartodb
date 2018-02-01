/**
 *  Fetch all query objects (querySchemaModel, queryGeometryModel, queryRowsCollection)
 *  if necessary
 */

module.exports = function (params, callback) {
  if (!params) throw new Error('all query objects are required');
  if (!params.querySchemaModel) throw new Error('querySchemaModel is required');
  if (!params.queryGeometryModel) throw new Error('queryGeometryModel is required');
  if (!params.queryRowsCollection) throw new Error('queryRowsCollection is required');

  var allFetched = function () {
    return params.querySchemaModel.isFetched() &&
           params.queryGeometryModel.isFetched() &&
           params.queryRowsCollection.isFetched();
  };

  var allErrored = function () {
    return params.querySchemaModel.hasRepeatedErrors() ||
           params.queryRowsCollection.hasRepeatedErrors() ||
           params.queryGeometryModel.hasRepeatedErrors();
  };

  var checkQueryGeometryModelFetch = function () {
    if (params.queryGeometryModel.shouldFetch()) {
      var opts = {};
      if (callback) {
        opts.success = callback;
      }

      params.queryGeometryModel.fetch(opts);
    } else {
      // we need to check if all are fetched because shouldFetch include the fetching state
      (allFetched() || allErrored()) && callback && callback();
    }
  };

  var checkQueryRowsCollectionFetch = function () {
    if (params.queryRowsCollection.shouldFetch()) {
      params.queryRowsCollection.fetch({
        success: checkQueryGeometryModelFetch
      });
    } else {
      checkQueryGeometryModelFetch();
    }
  };

  if (params.querySchemaModel.shouldFetch()) {
    params.querySchemaModel.fetch({
      success: checkQueryRowsCollectionFetch
    });
  } else {
    checkQueryRowsCollectionFetch();
  }
};
