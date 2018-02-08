const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
require('dashboard/components/form-components/index');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const template = require('./api-keys-form.tpl');

const REQUIRED_OPTS = [
  'apiKeysCollection',
  'stackLayoutModel'
];

const DEFAULT_API_GRANTS = {
  sql: false,
  maps: false
};

const DEFAULT_ATTRS = {
  name: '',
  token: '',
  apis: DEFAULT_API_GRANTS
};

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-submit': '_onFormSubmit'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._apiKeyModel = options.apiKeyModel;
  },

  render: function () {
    this.$el.empty();

    this._formView = this._generateForm();

    this.$el.append(this._formView.render().el);

    return this;
  },

  _generateForm: function () {
    const hasModel = !!this._apiKeyModel;

    const schema = {
      name: {
        type: 'Text',
        title: 'Name',
        validators: ['required'],
        editorAttrs: {
          disabled: hasModel,
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
          disabled: hasModel
        }
      }
    };

    const data = hasModel ? this._apiKeyModel.attributes : DEFAULT_ATTRS;

    return new Backbone.Form({ data, schema, template });
  },

  _onClickBack: function () {
    this._stackLayoutModel.goToStep(0);
  },

  _onFormSubmit: function () {
    const errors = this._formView.validate();

    if (!errors) {
      const attrs = this._formView.getValue();

      // TODO: What do we do when there is an error?
      this._apiKeysCollection.create(attrs, {
        success: (model) => {
          this._apiKeyModel = model;
          this.render();
        }
      });
    }
  }
});
