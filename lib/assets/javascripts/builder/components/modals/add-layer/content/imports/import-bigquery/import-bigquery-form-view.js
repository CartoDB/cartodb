const $ = require('jquery');
const _ = require('underscore');
const CartoNode = require('carto-node');
const ImportDataFormView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-form-view');
const BillingProjectView = require('./billing-project-view');
const CodeMirror = require('codemirror');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./import-bigquery-form.tpl');

const REQUIRED_OPTS = [
  'userModel',
  'configModel'
];

/**
 *  Form view for BigQuery
 *
 *
 */

module.exports = ImportDataFormView.extend({

  connector: {
    'provider': 'bigquery',
    'project': '%DATABASE%',
    'import_as': '%TABLE_NAME%',
    'sql_query': '%QUERY%'
  },

  events: {
    'submit .js-form': '_onSubmitForm'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.template = template;

    this._initBinds();
    this._checkVisibility();
  },

  render: function () {
    this.$el.html(
      this.template({
        state: this.model.get('state'),
        errorMessage: this.model.get('errorMessage')
      })
    );
    this._initViews();
    this._initCodeMirror();

    if (this.formFields) {
      this.$el.find('.js-select')[0].value = this.formFields.billingProject;
      this.codeEditor.setValue(this.formFields.sqlQuery);
    }
  },

  _initViews: function () {
    const billingProjectView = new BillingProjectView({
      el: this.$('.ImportOptions__select'),
      configModel: this._configModel
    });
    billingProjectView.render();
    this.addView(billingProjectView);
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
    const billingProject = this.$('.js-select').val();
    const query = this.codeEditor.getValue();
    if (billingProject && query) {
      $('.js-submit').removeClass('is-disabled');
    } else {
      $('.js-submit').addClass('is-disabled');
    }
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);

    const query = this.codeEditor.getValue();
    if (!query) {
      return;
    }

    this.formFields = {
      billingProject: this.$('.js-select').val(),
      sqlQuery: query
    };

    // Change file attributes :S
    this.trigger('urlSelected', this);

    // Change model
    const importType = this.model.get('service_name') ? 'service' : 'url';
    this.model.setUpload({
      type: importType,
      value: query,
      service_item_id: query,
      state: 'idle'
    });

    const client = new CartoNode.AuthenticatedClient();
    const params = {
      billing_project: this.formFields.billingProject,
      sql_query: this.formFields.sqlQuery
    };

    client.dryRun(params, (errors, _response, data) => {
      if (errors) {
        this.model.set('errorMessage', _t('components.modals.add-layer.imports.database.sql-error'));
        this.model.set('state', 'list');
        this.model.setUpload({
          value: '',
          service_item_id: ''
        });
        this.render();
      } else if (data && data.total_bytes_processed) {
        if (this.model.get('state') !== 'error') {
          this.model.set('state', 'selected');
          this.trigger('urlSubmitted', this);
        }
      }
    });
  },

  _checkVisibility: function () {
    const state = this.model.get('state');
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
        let sql = this.model.get('service_item_id');
        const catalog = this._extractCatalog(sql);
        const tableName = this._extractTableName(sql);
        sql = this._prepareSql(sql);

        this.connector.project = catalog;
        this.connector.import_as = tableName;
        this.connector.sql_query = sql;
        this.connector.billing_project = this.$('.js-select').val();

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
    const parts = this._preprocessSql(sql).split(' from ');
    return parts[1].split('.')[0];
  },

  _extractTableName: function (sql) {
    const parts = this._preprocessSql(sql).split(' from ');
    const table = parts[1].split(' ')[0];
    return table.split('.').join('_');
  },

  _prepareSql: function (sql) {
    return sql;
  }
});
