var dataImportView = require('./data_form_view');

/**
 *  Form view for BigQuery
 *
 *
 */

module.exports = dataImportView.extend({

  connector: {
    "provider": "bigquery",
    "project": "%DATABASE%",
    "table": "%TABLE_NAME%",
    "sql_query": "%QUERY%"
  },

  _initBinds: function () {
    this.model.bind('change:state', this._checkVisibility, this);
  },

  _checkVisibility: function () {
    var state = this.model.get('state');
    if (state === 'list') {
      this.show();
    } else {
      this.hide();
    }
    this._checkErrors(state);
    this._prepareData(state);
  },

  _checkErrors: function (state) {
    if (state === 'error') {
      this._showTextError();
    } else {
      this._hideTextError();
    }
  },

  _prepareData: function (state) {
    if (state === 'selected') {
      try {
        var sql = this.model.get('service_item_id');
        var catalog = this._extractCatalog(sql);
        var tableName = this._extractTableName(sql);
        sql = this._prepareSql(sql);

        this.connector.project = catalog;
        this.connector.table = tableName;
        this.connector.sql_query = sql;

        this.model.set('service_item_id', JSON.stringify(this.connector));
      } catch (e) {
        this.model.set('state', error);
      }
    }
  },

  _preprocessSql: function (sql) {
    return sql.toLowerCase().split('`').join('');
  },

  _extractCatalog: function (sql) {
    var parts = this._preprocessSql(sql).split(' from ');
    return parts[1].split('.')[0];
  },

  _extractTableName: function (sql) {
    var parts = this._preprocessSql(sql).split(' from ');
    var table = parts[1].split(' ')[0];
    return table.split('.').join('_');
  },

  _prepareSql: function (sql) {
    return sql;
  }

});
