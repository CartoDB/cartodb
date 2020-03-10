const _ = require('underscore');
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
        errorMessage: this.model.get('errorMessage')
      })
    );

    this._initCodeMirror();

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
      placeholder: _t('components.modals.add-layer.imports.database.placeholder')
    });
    this.codeEditor.on('change', _.debounce(this._onTextChanged.bind(this), 150), this);
  },

  _initBinds: function () {
    this.model.bind('change:state', this._checkVisibility, this);
    this.model.bind('change:errorMessage', this.render, this);
  },

  _checkVisibility: function () {
    const state = this.model.get('state');
    if (state === 'connected') {
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
      this.model.set('errorMessage', _t('components.modals.add-layer.imports.database.sql-error'));
    }
  },

  _goSelectDataset: function () {
    if (this.model.get('state') !== 'error') {
      this.model.set('state', 'selected');
      this.trigger('urlSubmitted', this);
    }
  }
});
