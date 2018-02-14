const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
require('dashboard/components/form-components/index');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const ApiKeyModel = require('dashboard/data/api-key-model');
const TableGrantsView = require('dashboard/components/table-grants/table-grants');
const TipsyTooltipView = require('cartodb3/components/tipsy-tooltip-view');
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
    this._formView = this._generateForm();

    this.listenTo(this._formView, 'change', this._onFormChanged);
    this.listenTo(this._apiKeyModel, 'change:tables', this._onFormChanged);
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

    this.$('.js-api-keys-form').append(this._formView.render().el);

    this._tableGrantsView = new TableGrantsView({
      apiKeyModel: this._apiKeyModel,
      userTablesModel: this._userTablesModel
    });

    this.$('.js-api-keys-tables').append(this._tableGrantsView.render().el);

    this._renderTooltip();
  },

  _generateForm: function () {
    const isDisabled = !!this._apiKeyModel.get('id');

    const schema = {
      name: {
        type: 'Text',
        title: 'Name',
        validators: ['required'],
        hideValidationErrors: true,
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
        validators: ['required'],
        hideValidationErrors: true,
        fieldClass: 'u-iBlock',
        inputs: [
          { name: 'sql', label: 'SQL' },
          { name: 'maps', label: 'MAPS' }
        ],
        editorAttrs: {
          disabled: isDisabled
        }
      }
    };

    this._formView = new Backbone.Form({ model: this._apiKeyModel, schema });

    return this._formView;
  },

  _onSearchChanged: function (value) {
    if (!this._apiKeyModel.id) {
      this._userTablesModel.setQuery(value);
    }
  },

  _onClickBack: function () {
    this._stackLayoutModel.goToStep(0);
  },

  _renderTooltip: function () {
    this._errorTooltip = new TipsyTooltipView({
      el: this.$('.js-submit'),
      gravity: 's',
      title: () => 'Name, Type and Datasets fields are required'
    });
    this.addView(this._errorTooltip);
  },

  _hasErrors: function () {
    const formErrors = this._formView.validate();
    const selectedPermissions = this._apiKeyModel.hasPermissionsSelected();

    return !!formErrors || !selectedPermissions;
  },

  _onFormChanged: function () {
    const hasErrors = this._hasErrors();

    this.$('.js-submit').toggleClass('is-disabled', hasErrors);

    if (hasErrors) {
      this._errorTooltip || this._renderTooltip();
    } else {
      this._errorTooltip && this._errorTooltip.clean();
    }
  },

  _onFormSubmit: function () {
    if (this._hasErrors()) return;

    const errors = this._formView.commit({ validate: true });

    if (!errors) {
      this._apiKeysCollection.create(this._apiKeyModel.attributes, {
        success: (model) => {
          this._apiKeyModel = model;
          this._generateForm();
          this.render();
        },
        error: (model, request) => {
          if (request.responseText.indexOf('Name has already been taken') !== -1) {
            // TODO: Handle this
          }
        }
      });
    }
  },

  clean: function () {
    this._userTablesModel.setQuery('');
    CoreView.prototype.clean.apply(this, arguments);
  }
});
