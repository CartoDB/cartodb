const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const template = require('./table-grants.tpl');
const formTemplate = require('./table-grants-form.tpl');
const itemTemplate = require('./table-grants-item.tpl');

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

    this._initBinds();
  },

  render: function () {
    this.$el.html(template());

    this._renderFormView();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._userTablesModel, 'change', this._renderFormView);
  },

  _renderFormView: function () {
    this._formView && this._formView.off('change', this._onFormViewChanged, this);

    this._createFormView();

    this.$('.js-datasets-list').html(this._formView.render().el);
  },

  _createFormView: function () {
    const tables = this._getTables();

    const multiCheckbox = {
      type: 'MultiCheckbox',
      title: false,
      editorAttrs: {
        disabled: !!this._apiKeyModel.id,
        inputs: [
          { name: 'select', label: 'Read' },
          { name: 'update', label: 'Write' },
          { name: 'insert', label: 'Insert' },
          { name: 'delete', label: 'Delete' }
        ]
      }
    };

    const schema = _.mapObject(tables, () => multiCheckbox);

    const data = _.mapObject(tables, (value, tableName) => {
      const table = this._apiKeyModel.get('tables')[tableName] || value;

      return table.permissions;
    });

    this._formView = new Backbone.Form({ data, schema, template: this._generateFormMarkup });
    this._formView.on('change', this._onFormViewChanged, this);
  },

  _generateFormMarkup: function () {
    const rows = Object.keys(this.data).map((tableName) => itemTemplate({ tableName })).join('');
    return formTemplate({ rows });
  },

  _getTables: function () {
    return this._apiKeyModel.id
      ? this._apiKeyModel.get('tables')
      : this._userTablesModel.attributes;
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
