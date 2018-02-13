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

    this._generateForm();

    this.$('.js-datasets-list').html(this._formView.render().el);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._userTablesModel, 'change', this._onDatasetsListChanged);
  },

  _onDatasetsListChanged: function () {
    this._formView.off('change');

    this._generateForm();

    this.$('.js-datasets-list').html(this._formView.render().el);
  },

  _initViews: function () {
    this._formView = this._generateForm();
    window._formView = this._formView;
  },

  _generateMarkup: function () {
    const rows = Object.keys(this.data).map((tableName) => itemTemplate({ tableName })).join('');
    return formTemplate({ rows });
  },

  _generateForm: function () {
    const tables = this._getTables();
    const tableNames = Object.keys(tables);

    const params = {
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

    const schema = tableNames.reduce((total, tableName) => ({
      ...total,
      [tableName]: params
    }), {});

    const data = tableNames.reduce((total, tableName) => ({
      ...total,
      [tableName]: tables[tableName].permissions
    }), {});

    this._formView = new Backbone.Form({ data, schema, template: this._generateMarkup });
    this._formView.on('change', this._onFormChanged, this);
  },

  _getTables: function () {
    return this._apiKeyModel.id
      ? this._apiKeyModel.get('tables')
      : this._userTablesModel.attributes;
  },

  _onFormChanged: function (form) {
    this._apiKeyModel.set({
      tables: { ...this._apiKeyModel.get('tables'), ...form.getValue() }
    });
  },

  _onSearchChanged: _.debounce(function (event) {
    this._userTablesModel.setQuery(event.target.value);
    this._userTablesModel.fetch({ reset: true });
  }, 500, this)
});
