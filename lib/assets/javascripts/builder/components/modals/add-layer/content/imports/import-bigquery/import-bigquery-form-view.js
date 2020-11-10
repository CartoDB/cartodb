const _ = require('underscore');
const CartoNode = require('carto-node');
const ImportDataFormView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-form-view');
const BillingProjectView = require('./billing-project-view');
const CodeMirror = require('codemirror');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./import-bigquery-form.tpl');
const commonForm = require('builder/components/modals/add-layer/content/imports/import-database/import-database-common');

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'authModel'
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
    'keyup .js-textInput': '_onTextChanged',
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
        errorMessages: this.model.get('errorMessages')
      })
    );
    this._initViews();
    this._initCodeMirror();

    if (this.formFields) {
      this.$el.find('.js-select')[0].value = this.formFields.billingProject;
      this.codeEditor.setValue(this.formFields.sqlQuery);
      this.$el.find('.js-textInput')[0].value = this.formFields.importAs;
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
    this.model.bind('change:errorMessages', this.render, this);
  },

  _checkVisibility: function () {
    const state = this.model.get('state');
    if (state === 'list') {
      this.show();
    } else {
      this.hide();
    }
  },

  _onTextChanged: function () {
    (this._isFormFilled() ? commonForm.enableButton(this.$('.js-submit')) : commonForm.disableButton(this.$('.js-submit')));
  },

  _isFormFilled: function () {
    return this.$('.js-select').val() !== '' &&
      this.codeEditor.getValue() !== '' &&
      this.$('.js-textInput').val() !== '';
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);

    const query = this.codeEditor.getValue();
    if (!query) {
      return;
    }

    this.formFields = {
      billingProject: this.$('.js-select').val(),
      sqlQuery: query,
      importAs: this.$('.js-textInput').val()
    };

    if (this._authModel.isServiceAuthentication()) {
      // service mode takes precedence...
      this._goToConnectStep();
    } else if (this._authModel.isUserAuthentication()) {
      // Currently dryrun is only supported when working over OAuth, not on service auth
      this._performDryRunBeforeConnectStep();
    }
  },

  _performDryRunBeforeConnectStep: function () {
    const dbConnectorsClient = new CartoNode.AuthenticatedClient().dbConnectors();
    const params = {
      billing_project: this.formFields.billingProject,
      sql_query: this.formFields.sqlQuery.replace(/\n/g, ' ')
    };

    dbConnectorsClient.dryRun('bigquery', params, (errors, _response, data) => {
      if (errors) {
        this._handleErrors(data);
      } else if (data && data.hasOwnProperty('total_bytes_processed')) {
        this._goToConnectStep();
      }
    });
  },

  _goToConnectStep: function () {
    this._prepareUploadModel(this.formFields.sqlQuery);
    this._updateUploadModel();
    this._goSelectDataset();
  },

  _updateUploadModel: function () {
    try {
      this.connector.billing_project = this.formFields.billingProject;
      this.connector.import_as = this.formFields.importAs;
      this.connector.sql_query = this.formFields.sqlQuery.replace(/\n/g, ' ');

      this.model.set('service_item_id', JSON.stringify(this.connector));
    } catch (e) {
      this._handleErrors();
    }
  },

  _prepareUploadModel: function (query) {
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
  },

  _goSelectDataset: function () {
    if (this.model.get('state') !== 'error') {
      this.model.set('state', 'selected');
      this.trigger('urlSubmitted', this);
    }
  },

  _handleErrors: function (data) {
    let errorMessages = [];
    if (data.responseJSON && data.responseJSON.errors) {
      errorMessages.push(this._getPrintableError(data.responseJSON.errors));
    } else {
      errorMessages.push(_t('components.modals.add-layer.imports.database.general-error'));
    }
    this.model.set('state', 'list');
    this.model.setUpload({
      value: '',
      service_item_id: ''
    });
    this.model.set('errorMessages', errorMessages);
  },

  _getPrintableError: function (error) {
    let partialError = error.replace('Error connecting to provider bigquery: ', '');
    const errorMatch = partialError.match(/\bERROR:\s*([\s\S]+)/m);
    if (errorMatch) {
      partialError = errorMatch[1];
    }
    return partialError;
  }
});
