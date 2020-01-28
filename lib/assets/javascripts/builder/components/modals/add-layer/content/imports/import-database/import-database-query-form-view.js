const _ = require('underscore');
const ImportDataView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-form-view');
const template = require('./import-database-query-form.tpl');
const CodeMirror = require('codemirror');
const common = require('./import-database-common');

module.exports = ImportDataView.extend({

  events: {
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

    if (this.sqlQuery) {
      this.codeEditor.setValue(this.sqlQuery);
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
  },

  _onTextChanged: function () {
    const query = this.codeEditor.getValue();
    (query ? common.enableButton(this.$('.js-submit')) : common.disableButton(this.$('.js-submit')));
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);

    const query = this.codeEditor.getValue().replace(/\n/g, ' ');
    if (!query) {
      return;
    }

    this.sqlQuery = query;

    this.trigger('urlSelected', this);

    // Change model
    const importType = this.model.get('service_name') ? 'service' : 'url';
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
    const state = this.model.get('state');
    if (state === 'connected') {
      this.show();
    } else {
      this.hide();
    }
    this._prepareData(state);
  },

  _prepareData: function (state) {
    if (state === 'selected') {
      try {
        const connector = {
          provider: this.options.service,
          connection: this.model.connection,
          sql_query: this.model.get('service_item_id'),
          import_as: this._extractTableName(this.model.get('service_item_id'))
        };

        this.model.set('service_item_id', JSON.stringify(connector));
      } catch (e) {
        this.model.set('errorMessage', _t('components.modals.add-layer.imports.database.sql-error'));
        this.model.set('state', 'connected');
        this.model.setUpload({
          value: '',
          service_item_id: ''
        });
        this.render();
      }
    }
  },

  _extractTableName: function (sql) {
    const parts = sql.split(' from ');
    const table = parts[1].split(' ')[0];
    return table.split('.').join('_');
  }
});
