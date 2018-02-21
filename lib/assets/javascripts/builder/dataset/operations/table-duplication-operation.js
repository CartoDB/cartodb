var ImportModel = require('builder/data/background-importer/import-model');

module.exports = function (opts) {
  if (!opts.tableModel) throw new Error('tableModel is required');
  if (!opts.query) throw new Error('query is required');
  if (!opts.configModel) throw new Error('configModel is required');

  var tableModel = opts.tableModel;
  var configModel = opts.configModel;
  var query = opts.query;
  var successCallback = opts.onSuccess;
  var errorCallback = opts.onError;
  var attrs = {
    table_name: tableModel.getUnqualifiedName() + '_copy',
    sql: query
  };

  var importModel = new ImportModel({}, {
    configModel: configModel
  });
  importModel.save(attrs, {
    error: errorCallback && errorCallback,
    success: function (model, changes) {
      model.bind('change:state', function () {
        var state = this.get('state');
        var success = this.get('success');
        if (state === 'failure') {
          errorCallback && errorCallback(model);
        } else if (state === 'complete' && success) {
          successCallback && successCallback(model);
        }
      }, model);
    }
  });
};
