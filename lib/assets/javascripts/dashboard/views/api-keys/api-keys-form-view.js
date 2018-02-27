const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
require('dashboard/components/form-components/index');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const ApiKeyModel = require('dashboard/data/api-key-model');
const TableGrantsView = require('dashboard/components/table-grants/table-grants-view');
const TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
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
    const modelIsNew = !this._apiKeyModel.get('id');
    this.$el.append(template({
      showSubmit: modelIsNew
    }));

    this.$('.js-api-keys-form').append(this._formView.render().el);

    this._tableGrantsView = new TableGrantsView({
      apiKeyModel: this._apiKeyModel,
      userTablesModel: this._userTablesModel
    });

    this.addView(this._tableGrantsView);

    this.$('.js-api-keys-tables').append(this._tableGrantsView.render().el);

    if (modelIsNew) {
      this._renderTooltip();
    }
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
          placeholder: 'Your API key name',
          id: 'js-api-key-name'
        }
      },
      token: {
        type: 'Text',
        title: 'API Key',
        hasCopyButton: isDisabled,
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

  _onClickBack: function () {
    this._stackLayoutModel.goToStep(0);
  },

  _renderTooltip: function () {
    this._validationTooltip = new TipsyTooltipView({
      el: this.$('.js-submit'),
      gravity: 's',
      title: () => 'Name, Type and Datasets fields are required'
    });
    this.addView(this._validationTooltip);
  },

  _hasErrors: function () {
    const formErrors = this._formView.validate();
    const selectedPermissions = this._apiKeyModel.hasPermissionsSelected();

    return !!formErrors || !selectedPermissions;
  },

  _addApiKeyNameError: function (message) {
    this._errorTooltip = new TipsyTooltipView({
      el: this.$('#js-api-key-name'),
      gravity: 'w',
      title: () => message
    });
    this.addView(this._errorTooltip);
    this._errorTooltip.showTipsy();

    this.$('#js-api-key-name').addClass('has-error');
  },

  _onFormChanged: function () {
    const hasErrors = this._hasErrors();

    this.$('.js-submit').toggleClass('is-disabled', hasErrors);

    if (hasErrors) {
      this._validationTooltip || this._renderTooltip();
    } else {
      this._validationTooltip && this._validationTooltip.clean();
    }

    this.$('#js-api-key-name').removeClass('has-error');
    this._errorTooltip && this._errorTooltip.clean();
  },

  _onFormSubmit: function () {
    if (this._hasErrors()) return;

    const errors = this._formView.commit({ validate: true });

    if (errors) return;

    this._apiKeysCollection.create(this._apiKeyModel.attributes, {
      success: (model) => {
        this._apiKeyModel = model;
        this._generateForm();
        this.render();
      },
      error: (model, request) => {
        this._handleError(request.responseText);
      }
    });
  },

  _handleError: function (error) {
    let message;

    if (error.indexOf('Name has already been taken') !== -1) {
      message = 'Name already exists';
    } else if (error.indexOf('Name can\'t be blank') !== -1) {
      message = 'Name can\'t be blank';
    }

    message && this._addApiKeyNameError(message);
  },

  clean: function () {
    this._userTablesModel.clearParams();
    CoreView.prototype.clean.apply(this, arguments);
  }
});
