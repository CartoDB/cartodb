const _ = require('underscore');
const CartoNode = require('carto-node');
const ImportDataFormView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-form-view');
const template = require('./import-database-query-form.tpl');
const CodeMirror = require('codemirror');
const common = require('./import-database-common');

module.exports = ImportDataFormView.extend({

  events: {
    'keyup .js-textInput': '_onTextChanged',
    'submit .js-form': '_onSubmitForm'
  },

  render: function () {
    this.$el.html(
      template({
        title: this.options.title,
        state: this.model.get('state'),
        errorMessages: this.model.get('errorMessages'),
        sqlHint: this.options.sql_hint || _t('components.modals.add-layer.imports.database.sql-hint')
      })
    );

    this._initCodeMirror();
    this.dbConnectorsClient = new CartoNode.AuthenticatedClient().dbConnectors();

    if (this.formFields) {
      this.codeEditor.setValue(this.formFields.sqlQuery);
      this.$el.find('.js-textInput')[0].value = this.formFields.importAs;
    }
    return this;
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
      placeholder: this.options.placeholder_query
    });
    this.codeEditor.on('change', _.debounce(this._onTextChanged.bind(this), 150), this);
  },

  _initBinds: function () {
    this.model.bind('change:state', this._checkVisibility, this);
    this.model.bind('change:errorMessages', this.render, this);
  },

  _checkVisibility: function () {
    const state = this.model.get('state');
    if (state === 'connected' || state === 'list') {
      this.show();
    } else {
      this.hide();
    }
  },

  _onTextChanged: function () {
    (this._isFormFilled() ? common.enableButton(this.$('.js-submit')) : common.disableButton(this.$('.js-submit')));
  },

  _isFormFilled: function () {
    return this.codeEditor.getValue() !== '' &&
           this.$('.js-textInput').val() !== '';
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);

    const query = this.codeEditor.getValue();
    if (!query) {
      return;
    }

    this.formFields = {
      sqlQuery: query,
      importAs: this.$('.js-textInput').val()
    };

    this._performDryRun(query);
  },

  _performDryRun: function (query) {
    const params = {
      provider: this.options.service,
      connection: this.model.connection,
      sql_query: query,
      import_as: this.formFields.importAs
    };
    this.dbConnectorsClient.dryRun(this.options.service, params, (errors, _response, data) => {
      if (errors) {
        this._handleErrors(data);
      } else {
        this._goToConnectStep(query);
      }
    });
  },

  _goToConnectStep: function (query) {
    this._prepareUploadModel(query);
    this._updateUploadModel();
    this._goSelectDataset();
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

  _updateUploadModel: function () {
    try {
      const connector = {
        provider: this.options.service,
        connection: this.model.connection,
        sql_query: this.formFields.sqlQuery.replace(/\n/g, ' '),
        import_as: this.formFields.importAs
      };

      this.model.set('service_item_id', JSON.stringify(connector));
    } catch (e) {
      this.model.set('state', 'connected');
      this.model.setUpload({
        value: '',
        service_item_id: ''
      });
      this.model.set('errorMessages', [_t('components.modals.add-layer.imports.database.sql-error')]);
    }
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
    let partialError = error.replace(`Error connecting to ${this.options.service}: `, '');
    const errorMatch = partialError.match(/\bERROR:\s*([\s\S]+)/m);
    if (errorMatch) {
      partialError = errorMatch[1];
    }
    return partialError;
  }
});
