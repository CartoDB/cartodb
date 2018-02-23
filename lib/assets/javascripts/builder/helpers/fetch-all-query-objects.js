var _ = require('underscore');
var LocaleHelper = require('builder/helpers/locale');
var SQLNotifications = require('builder/sql-notifications');

/**
 *  Fetch all query objects (querySchemaModel, queryGeometryModel, queryRowsCollection)
 *  if necessary
 */

var getNotificationMessage = function (error, type) {
  var prefix = 'notifications.sql.';
  var key = prefix + type;
  var result = LocaleHelper.linkify(key);
  return result || (error && _.first(error)) || _t('notifications.sql.unknown.body');
};

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

  var forceErrors = function (errors, options) {
    var hasErrors = errors && errors.length > 0;
    var parsedErrors = hasErrors && parseErrors(errors);

    if (hasErrors) {
      SQLNotifications.showErrorNotification(parsedErrors);
    }
  };

  var parseErrors = function (errors) {
    if (!errors) {
      return [];
    }

    errors = _.isArray(errors) ? errors : [errors];
    return errors.map(function (error) {
      return {
        message: error
      };
    });
  };

  var errorSQL = function (err) {
    var type = err && err.status;
    var error = getNotificationMessage(err.error, type);
    forceErrors(error, {
      showEditorError: type === 400
    });
  };

  var checkQueryRowsCollectionFetch = function () {
    if (params.queryRowsCollection.shouldFetch()) {
      params.queryRowsCollection.fetch({
        success: checkQueryGeometryModelFetch,
        error: errorSQL
      });
    } else {
      checkQueryGeometryModelFetch();
    }
  };

  if (params.querySchemaModel.shouldFetch()) {
    params.querySchemaModel.fetch({
      success: checkQueryRowsCollectionFetch,
      error: errorSQL
    });
  } else {
    checkQueryRowsCollectionFetch();
  }
};
