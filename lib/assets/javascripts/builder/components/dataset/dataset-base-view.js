var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var SQLNotifications = require('builder/sql-notifications');
var SQLUtils = require('builder/helpers/sql-utils');
var Notifier = require('builder/components/notifier/notifier');
var cdb = require('internal-carto.js');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'editorModel',
  'layerDefinitionModel',
  'querySchemaModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

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

    this._applyButtonStatusModel = new Backbone.Model({
      loading: false
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

      this._applyButtonStatusModel.set('loading', true);

      this._sqlModel.set('content', currentQuery);

      this._SQL.execute(currentQuery, null, {
        success: function () {
          SQLNotifications.showNotification({
            status: 'success',
            info: _t('notifications.sql.alter-success'),
            closable: true,
            delay: Notifier.DEFAULT_DELAY
          });

          this._applyButtonStatusModel.set('loading', false);

          this._applyDefaultSQLAfterAlteringData();

          if (typeof callbackAfterAlterSuccess === 'function') {
            callbackAfterAlterSuccess.call(this);
          }
        }.bind(this),
        error: function (errors) {
          var parsedErrors = this._parseErrors(errors.responseJSON.error);

          this._applyButtonStatusModel.set('loading', false);

          this._codemirrorModel.set('errors', parsedErrors);

          SQLNotifications.showErrorNotification(parsedErrors);

          this._checkClearButton();
        }.bind(this)
      });
    } else {
      this._runQuery(currentQuery, this._saveSQL.bind(this));
    }
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
    this._clearSQL();
  },

  _clearSQL: function () {
    var originalQuery = this._defaultSQL();
    this._codemirrorModel.set({
      content: originalQuery,
      errors: []
    });
    this._runQuery(originalQuery, this._saveSQL.bind(this));
  },

  _showErrors: function (model) {
    var errors = this._querySchemaModel.get('query_errors');
    this._forceErrors(errors);
    this._checkClearButton();
  },

  _forceErrors: function (errors, options) {
    var hasErrors = errors && errors.length > 0;
    var parsedErrors = hasErrors && this._parseErrors(errors);
    var editorErrors = options && options.showEditorError === false ? [] : parsedErrors;
    this._codemirrorModel.set('errors', editorErrors);
    this._editorModel.set('disabled', hasErrors);

    if (hasErrors) {
      SQLNotifications.showErrorNotification(parsedErrors);
    }
  },

  _parseErrors: function (errors) {
    if (!errors) {
      return [];
    }

    errors = _.isArray(errors) ? errors : [errors];
    return errors.map(function (error) {
      return {
        message: error
      };
    });
  }
});
