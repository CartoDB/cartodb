var cdb = require('internal-carto.js');

var ongoingQuery = false;

var zoomToData = function (configModel, stateModel, query) {
  if (!configModel) throw new Error('configModel is required');
  if (!stateModel) throw new Error('stateModel is required');
  if (!query) throw new Error('query is required');

  var queryLauncher = new cdb.SQL({
    user: configModel.get('user_name'),
    sql_api_template: configModel.get('sql_api_template'),
    api_key: configModel.get('api_key')
  });

  if (!ongoingQuery) {
    ongoingQuery = true;

    queryLauncher.getBounds(query)
      .done(function (bounds) {
        ongoingQuery = false;

        stateModel.setBounds(bounds);
      })
      .error(function () {
        ongoingQuery = false;
      });
  }
};

module.exports = zoomToData;
