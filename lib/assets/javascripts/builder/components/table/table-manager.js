var TableView = require('./table-view');
var QueryColumnsCollection = require('cartodb3/data/query-columns-collection');
var TableNameUtils = require('cartodb3/helpers/table-name-utils');
var checkAndBuildOpts = require('cartodb3/helpers/required-opts');

var REQUIRED_OPTS = [
  'analysisDefinitionNodeModel',
  'configModel',
  'modals',
  'userModel'
];

/**
 *  Table manager that generates necessary models/collections
 *  for the view
 *
 */

module.exports = {
  create: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    // Adds the owner username if it's in an organization and the table name is not already qualified
    var tableName = this._analysisDefinitionNodeModel.get('table_name');
    var userName = TableNameUtils.getUsername(tableName) || this._userModel.get('username');
    tableName = TableNameUtils.getQualifiedTableName(
      tableName,
      userName,
      this._userModel.isInsideOrg()
    );

    var querySchemaModel = this._analysisDefinitionNodeModel.querySchemaModel;

    var columnsCollection = new QueryColumnsCollection(
      querySchemaModel.columnsCollection.toJSON(),
      {
        configModel: this._configModel,
        tableName: tableName,
        querySchemaModel: querySchemaModel
      }
    );

    return new TableView({
      relativePositionated: opts.relativePositionated,
      modals: this._modals,
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      columnsCollection: columnsCollection,
      tableName: tableName
    });
  },

  destroy: function (tableView) {
    if (!tableView) throw new Error('tableView object is needed');
    tableView.clean();
  }
};
