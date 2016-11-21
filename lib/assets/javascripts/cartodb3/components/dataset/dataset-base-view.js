var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var SQLNotifications = require('../../sql-notifications');
var SQLUtils = require('../../helpers/sql-utils');
var Notifier = require('../../components/notifier/notifier');
var cdb = require('cartodb.js');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._editorModel = opts.editorModel;
    this._configModel = opts.configModel;
    this._querySchemaModel = opts.querySchemaModel;

    this._clearSQLModel = new Backbone.Model({
      visible: false
    });

    this._sqlModel = this._layerDefinitionModel.sqlModel;

    this._SQL = new cdb.SQL({
      user: this._configModel.get('user_name'),
      sql_api_template: this._configModel.get('sql_api_template'),
      api_key: this._configModel.get('api_key')
    });

    this._codemirrorModel = new Backbone.Model({
      content: this._querySchemaModel.get('query'),
      readonly: false
    });

    SQLNotifications.track(this);
  },

  _internalParseSQL: function (callbackAfterAlterSuccess) {
    var appliedQuery = this._querySchemaModel.get('query');
    var currentQuery = this._codemirrorModel.get('content');

    // Remove last character if it has ';'
    if (currentQuery && currentQuery.slice(-1) === ';') {
      currentQuery = currentQuery.slice(0, currentQuery.length - 1);
      this._codemirrorModel.set('content', currentQuery);
    }

    var isSameQuery = SQLUtils.isSameQuery(currentQuery, appliedQuery);
    var altersData = SQLUtils.altersData(currentQuery);

    if (currentQuery === '' || isSameQuery) {
      SQLNotifications.removeNotification();
      return false;
    }

    if (altersData) {
      SQLNotifications.showNotification({
        status: 'loading',
        info: _t('notifications.sql.alter-loading'),
        closable: false
      });

      this._sqlModel.set('content', currentQuery);

      this._SQL.execute(currentQuery, null, {
        success: function () {
          SQLNotifications.showNotification({
            status: 'success',
            info: _t('notifications.sql.alter-success'),
            closable: true,
            delay: Notifier.DEFAULT_DELAY
          });
          this._applyDefaultSQLAfterAlteringData();
          if (typeof callbackAfterAlterSuccess === 'function') {
            callbackAfterAlterSuccess.call(this);
          }
        }.bind(this),
        error: function (errors) {
          errors = errors.responseJSON.error;
          var parsedErrors = this._parseErrors(errors);
          this._codemirrorModel.set('errors', parsedErrors);
          SQLNotifications.showErrorNotification(parsedErrors);
          this._checkClearButton();
        }.bind(this)
      });
    } else {
      this._runQuery(currentQuery, this._saveSQL.bind(this));
    }
  },

  _runQuery: function (query, callback) {
    this._querySchemaModel.set({
      query: query,
      status: 'unfetched'
    });

    this._queryGeometryModel.set({
      query: query
    });

    SQLNotifications.showNotification({
      status: 'loading',
      info: _t('notifications.sql.applying'),
      closable: false
    });

    var saveSQL = _.after(2, callback);
    this._querySchemaModel.fetch({ success: saveSQL,
      complete: function (model, response, options) {
        if (response === 'abort') {
          SQLNotifications.removeNotification();
        }
      }
    });
    this._queryGeometryModel.fetch({ complete: saveSQL });
  },

  _checkClearButton: function () {
    var customSql = this._codemirrorModel.get('content');
    var isDefaultQuery = SQLUtils.isSameQuery(customSql, this._defaultSQL());
    this._clearSQLModel.set({ visible: !isDefaultQuery });
  },

  _applyDefaultSQLAfterAlteringData: function () {
    var originalQuery = this._defaultSQL();
    this._codemirrorModel.set({
      content: originalQuery,
      errors: []
    });
    this._sqlModel.set('content', originalQuery);
    this._querySchemaModel.set('query_errors', []);
    this._clearSQLModel.set({ visible: false });
    this._querySchemaModel.resetDueToAlteredData();
  },

  _clearSQL: function () {
    var originalQuery = this._defaultSQL();
    this._codemirrorModel.set({
      content: originalQuery,
      errors: []
    });
    this._parseSQL();
  },

  _showErrors: function (model) {
    var errors = this._querySchemaModel.get('query_errors');
    var hasErrors = errors && errors.length > 0;
    this._codemirrorModel.set('errors', this._parseErrors(errors));
    this._editorModel.set('disabled', hasErrors);

    if (hasErrors) {
      SQLNotifications.showErrorNotification(this._parseErrors(errors));
    }

    this._checkClearButton();
  },

  _parseErrors: function (errors) {
    return errors.map(function (error) {
      return {
        message: error
      };
    });
  }
});
