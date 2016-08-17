var _ = require('underscore');
var TableView = require('./table-view');
var QueryColumnsCollection = require('../../data/query-columns-collection');
var QueryRowsCollection = require('../../data/query-rows-collection');

/**
 *  Table manager that generates necessary models/collections
 *  for the view
 *
 */

module.exports = {
  create: function (opts) {
    _.each(['configModel', 'querySchemaModel', 'geometryModel', 'modals'], function (key) {
      if (!opts[key]) throw new Error(key + ' is required');
    }, this);

    var columnsCollection = new QueryColumnsCollection(
      opts.querySchemaModel.columnsCollection.toJSON(),
      {
        configModel: opts.configModel,
        tableName: opts.tableName,
        querySchemaModel: opts.querySchemaModel
      }
    );

    var rowsCollection = new QueryRowsCollection([],
      {
        configModel: opts.configModel,
        tableName: opts.tableName,
        querySchemaModel: opts.querySchemaModel
      }
    );

    return new TableView({
      relativePositionated: opts.relativePositionated,
      modals: opts.modals,
      rowsCollection: rowsCollection,
      columnsCollection: columnsCollection,
      geometryModel: opts.geometryModel,
      querySchemaModel: opts.querySchemaModel,
      tableName: opts.tableName,
      readonly: opts.readonly !== undefined ? opts.readonly : !opts.tableName
    });
  }
};
