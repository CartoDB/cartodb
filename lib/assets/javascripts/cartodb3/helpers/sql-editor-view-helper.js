var SQLNotifications = require('../sql-notifications');
var SQLUtils = require('./sql-utils');
var Notifier = require('../components/notifier/notifier');

var sqlEditorViewHelper = {

  _parseSQL: function (callbackAfterAlterSuccess) {
    if (typeof callbackAfterAlterSuccess !== 'function') throw new Error('callbackAfterAlterSuccess is required');

    var appliedQuery = this._querySchemaModel.get('query');
    var currentQuery = this._codemirrorModel.get('content');

    // Remove last character if it has ';'
    if (currentQuery && currentQuery.slice(-1) === ';') {
      currentQuery = currentQuery.slice(0, currentQuery.length - 1);
      this._codemirrorModel.set('content', currentQuery);
    }

    var isSameQuery = SQLUtils.isSameQuery(currentQuery, appliedQuery);
    var altersData = SQLUtils.altersData(currentQuery);

    if (currentQuery === '' || isSameQuery) {
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
          callbackAfterAlterSuccess();
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
      query: query,
      simple_geom: '',
      status: 'unfetched'
    }, { silent: true });

    SQLNotifications.showNotification({
      status: 'loading',
      info: _t('notifications.sql.applying'),
      closable: false
    });

    var saveSQL = _.after(2, callback);
    this._querySchemaModel.fetch({ success: saveSQL });
    this._queryGeometryModel.fetch({ complete: saveSQL });
  },

  _checkClearButton: function () {
    var customSql = this._codemirrorModel.get('content');
    var isDefaultQuery = SQLUtils.isSameQuery(customSql, this._defaultSQL());
    this._clearSQLModel.set({ visible: !isDefaultQuery });
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
  },

  _clearSQL: function () {
    var sql = this._defaultSQL();
    this._codemirrorModel.set({
      content: sql,
      errors: []
    });
    this._clearSQLModel.set({ visible: false });
    this._querySchemaModel.set('query_errors', []);
    SQLNotifications.removeNotification();  
    this._parseSQLFunction();
  }
};

module.exports = sqlEditorViewHelper;