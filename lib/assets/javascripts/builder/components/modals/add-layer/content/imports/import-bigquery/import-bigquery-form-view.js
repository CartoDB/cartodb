var $ = require('jquery');
var _ = require('underscore');
var ImportDataView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-form-view');
var CodeMirror = require('codemirror');

/**
 *  Form view for BigQuery
 *
 *
 */

module.exports = ImportDataView.extend({

  connector: {
    'provider': 'bigquery',
    'project': '%DATABASE%',
    'import_as': '%TABLE_NAME%',
    'sql_query': '%QUERY%'
  },

  events: {
    'keyup .js-textInput': '_onTextChanged',
    'submit .js-form': '_onSubmitForm'
  },

  render: function () {
    this.$el.html(this.template);
    this._initCodeMirror();
  },

  _initCodeMirror: function () {
    this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
      mode: 'text/x-pgsql',
      tabMode: 'indent',
      tabSize: 2,
      matchBrackets: true,
      lineNumbers: true,
      lineWrapping: true,
      theme: 'material',
      scrollbarStyle: 'simple',
      language: 'sql',
      addModeClass: true,
      placeholder: 'SELECT * FROM `eternal-ship-170218.test.test`'
    });
    this.codeEditor.on('change', _.debounce(this._onTextChanged.bind(this), 150), this);
  },

  _initBinds: function () {
    this.model.bind('change:state', this._checkVisibility, this);
  },

  _onTextChanged: function () {
    var billingProject = this.$('.js-textInput').val();
    var query = this.codeEditor.getValue();
    if (billingProject && query) {
      $('.js-submit').removeClass('is-disabled');
    } else {
      this._hideTextError();
      $('.js-submit').addClass('is-disabled');
    }
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);

    var query = this.codeEditor.getValue();

    if (!query) {
      this._hideTextError();
      return;
    }

    // Change file attributes :S
    this.trigger('urlSelected', this);

    // Change model
    var importType = this.model.get('service_name') ? 'service' : 'url';
    debugger;
    this.model.setUpload({
      type: importType,
      value: query,
      service_item_id: query,
      state: 'idle'
    });

    if (this.model.get('state') !== 'error') {
      this._hideFileError();
      this._hideTextError();
      this.model.set('state', 'selected');

      this.trigger('urlSubmitted', this);
    } else {
      this._showTextError();
    }
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
        this.connector.billing_project = this.$('.js-textInput').val();
        debugger;

        this.model.set('service_item_id', JSON.stringify(this.connector));
      } catch (e) {
        this.model.set('state', e);
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
