const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
require('dashboard/components/form-components/index');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const ApiKeyModel = require('dashboard/data/api-key-model');
const TableGrantsView = require('dashboard/components/table-grants/table-grants');
const template = require('./api-keys-form.tpl');

const REQUIRED_OPTS = [
  'apiKeysCollection',
  'stackLayoutModel',
  'userTablesModel',
  'userModel'
];

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-submit': '_onFormSubmit'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._apiKeyModel = options.apiKeyModel || new ApiKeyModel(null, { userModel: this._userModel });
  },

  render: function () {
    this.$el.empty();

    this._initViews();

    return this;
  },

  _initViews: function () {
    this.$el.append(template({
      showSubmit: !this._apiKeyModel.get('id')
    }));

    this._formView = this._generateForm();

    this.$('.js-api-keys-form').append(this._formView.render().el);

    this._tableGrantsView = new TableGrantsView({
      apiKeyModel: this._apiKeyModel,
      userTablesModel: this._userTablesModel
    });

    this.$('.js-api-keys-tables').append(this._tableGrantsView.render().el);
  },

  _generateForm: function () {
    const isDisabled = !!this._apiKeyModel.get('id');

    const schema = {
      name: {
        type: 'Text',
        title: 'Name',
        validators: ['required'],
        editorAttrs: {
          disabled: isDisabled,
          placeholder: 'Your API key name'
        }
      },
      token: {
        type: 'Text',
        title: 'API Key',
        editorAttrs: {
          disabled: true
        }
      },
      apis: {
        type: 'MultiCheckbox',
        title: 'Type',
        editorAttrs: {
          disabled: isDisabled,
          inputs: [
            { name: 'sql', label: 'SQL' },
            { name: 'maps', label: 'MAPS' }
          ]
        }
      }
    };

    return new Backbone.Form({ model: this._apiKeyModel, schema });
  },

  _onSearchChanged: function (value) {
    if (!this._apiKeyModel.id) {
      this._userTablesModel.setQuery(value);
    }
  },

  _onClickBack: function () {
    this._stackLayoutModel.goToStep(0);
  },

  _onFormSubmit: function () {
    const errors = this._formView.commit({ validate: true });

    if (!errors) {
      // TODO: What do we do when there is an error?
      this._apiKeysCollection.create(this._apiKeyModel.attributes, {
        success: (model) => {
          this._apiKeyModel = model;
          this.render();
        }
      });
    }
  }
});
