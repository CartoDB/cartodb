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
    this.$el.html(
      this.template({
        state: this.model.get('state'),
        errorMessage: this.model.get('errorMessage')
      })
    );
    this._initCodeMirror();

    if (this.formFields) {
      this.$el.find('.js-textInput')[0].value = this.formFields.billingProject;
      this.codeEditor.setValue(this.formFields.sqlQuery);
    }
  },

  _initCodeMirror: function () {
    this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
      mode: 'text/x-pgsql',
      theme: 'material',
      tabSize: 2,
      lineWrapping: true,
      lineNumbers: false,
      scrollbarStyle: 'simple',
      addModeClass: true,
      matchBrackets: true,
      placeholder: _t('components.modals.add-layer.imports.bigquery.placeholder')
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
      $('.js-submit').addClass('is-disabled');
    }
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);

    var query = this.codeEditor.getValue();
    if (!query) {
      return;
    }

    this.formFields = {
      billingProject: this.$('.js-textInput').val(),
      sqlQuery: query
    };

    // Change file attributes :S
    this.trigger('urlSelected', this);

    // Change model
    var importType = this.model.get('service_name') ? 'service' : 'url';
    this.model.setUpload({
      type: importType,
      value: query,
      service_item_id: query,
      state: 'idle'
    });

    if (this.model.get('state') !== 'error') {
      this.model.set('state', 'selected');
      this.trigger('urlSubmitted', this);
    }
  },

  _checkVisibility: function () {
    var state = this.model.get('state');
    if (state === 'list') {
      this.show();
    } else {
      this.hide();
    }
    this._prepareData(state);
  },

  _prepareData: function (state) {
    if (state === 'selected') {
      try {
        var sql = this.model.get('service_item_id');
        var catalog = this._extractCatalog(sql);
        var tableName = this._extractTableName(sql);
        sql = this._prepareSql(sql);

        this.connector.project = catalog;
        this.connector.import_as = tableName;
        this.connector.sql_query = sql;
        this.connector.billing_project = this.$('.js-textInput').val();

        this.model.set('service_item_id', JSON.stringify(this.connector));
      } catch (e) {
        this.model.set('errorMessage', _t('components.modals.add-layer.imports.database.sql-error'));
        this.model.set('state', 'list');
        this.model.setUpload({
          value: '',
          service_item_id: ''
        });
        this.render();
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
