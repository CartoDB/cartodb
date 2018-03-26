const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./table-grants.tpl');
const formTemplate = require('./table-grants-form.tpl');
const itemTemplate = require('./table-grants-item.tpl');
const loadingTemplate = require('./table-grants-loader.tpl');
const placeholderTemplate = require('./table-grants-placeholder.tpl');

const REQUIRED_OPTS = [
  'apiKeyModel',
  'userTablesModel'
];

module.exports = CoreView.extend({
  className: 'ApiKeysForm-grantsTable',

  events: {
    'input .js-search': '_onSearchChanged'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    if (this._apiKeyModel.isPublic()) {
      this._userTablesModel.fetchPublicDatasets();
    }

    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      showSearch: !this._apiKeyModel.id
    }));

    this._renderFormView();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._userTablesModel.getStateModel(), 'change:status', this._renderFormView);
  },

  _renderFormView: function () {
    this._formView && this._formView.off('change', this._onFormViewChanged, this);
    let view = loadingTemplate();

    if (this._userTablesModel.isFetched()) {
      if (this._userTablesModel.isEmpty()) {
        const message = this._userTablesModel.hasQuery() ? '0 datasets found' : 'There are no datasets';
        view = placeholderTemplate({ message });
      } else {
        view = this._createFormView().render().el;
      }
    }

    this.$('.js-datasets-list').html(view);
  },

  _createFormView: function () {
    const tables = this._getTables();

    const multiCheckbox = {
      type: 'MultiCheckbox',
      title: false,
      inputs: [
        { name: 'select', label: 'Select' },
        { name: 'insert', label: 'Insert' },
        { name: 'update', label: 'Update' },
        { name: 'delete', label: 'Delete' }
      ],
      editorAttrs: {
        disabled: !!this._apiKeyModel.id
      }
    };

    const schema = _.mapObject(tables, () => multiCheckbox);

    const data = _.mapObject(tables, (value, tableName) => {
      const table = this._apiKeyModel.get('tables')[tableName] || value;

      return table.permissions;
    });

    this._formView = new Backbone.Form({ data, schema, template: this._generateFormMarkup });
    this._formView.on('change', this._onFormViewChanged, this);

    return this._formView;
  },

  _generateFormMarkup: function () {
    const rows = Object.keys(this.data).map((tableName) => itemTemplate({ tableName })).join('');
    return formTemplate({ rows });
  },

  _getTables: function () {
    return !this._apiKeyModel.id || this._apiKeyModel.isPublic()
      ? this._userTablesModel.attributes
      : this._apiKeyModel.get('tables');
  },

  _onFormViewChanged: function (form) {
    const persistedTables = this._apiKeyModel.get('tables');

    const formTables = _.mapObject(form.getValue(), (value, key) => ({ permissions: value }));

    this._apiKeyModel.set({
      tables: {
        ...persistedTables,
        ...formTables
      }
    });
  },

  _onSearchChanged: _.debounce(function (event) {
    this._userTablesModel.setQuery(event.target.value);
  }, 500, this)
});
