const _ = require('underscore');
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

const API_TYPES = {
  maps: 'maps',
  sql: 'sql'
};

module.exports = CoreView.extend({
  className: 'ApiKeysForm',

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

    this._handleCheckboxState();

    return this;
  },

  _initViews: function () {
    this.$el.append(template({ modelIsNew: this._isNew() }));

    this.$('.js-api-keys-form').append(this._formView.render().el);

    this._tableGrantsView = new TableGrantsView({
      apiKeyModel: this._apiKeyModel,
      userTablesModel: this._userTablesModel
    });

    this.addView(this._tableGrantsView);

    this.$('.js-api-keys-tables').append(this._tableGrantsView.render().el);

    if (this._isNew()) {
      this._renderTooltip();
    }
  },

  _generateForm: function () {
    const isDisabled = !this._isNew();

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
        title: 'APIs',
        validators: ['required'],
        hideValidationErrors: true,
        fieldClass: 'u-iBlock',
        inputs: [
          { name: API_TYPES.sql, label: 'SQL' },
          { name: API_TYPES.maps, label: 'MAPS' }
        ],
        editorAttrs: {
          disabled: isDisabled
        }
      }
    };

    this._formView = new Backbone.Form({ model: this._apiKeyModel, schema });

    return this._formView;
  },

  _isNew: function () {
    return !this._apiKeyModel.get('id');
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
    this._handleFormErrors();
    this._handleCheckboxState();
    this.$('.js-error').hide();
  },

  _handleCheckboxState: function () {
    const apis = this._isNew()
      ? this._formView.getValue().apis
      : this._apiKeyModel.get('apis');
    const activeApis = _.keys(apis).filter(name => apis[name]);
    const disableCheckboxes = activeApis.length === 1 && _.contains(activeApis, API_TYPES.maps);

    this.$('.ApiKeysForm-grantsTable').toggleClass('showOnlySelect', disableCheckboxes);
  },

  _handleFormErrors: function () {
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

  _onFormSubmit: function (event) {
    const saveButton = this.$('.js-submit');
    const isButtonLoading = saveButton.hasClass('is-loading');

    if (this._hasErrors() || isButtonLoading) return;

    saveButton.addClass('is-loading');

    const errors = this._formView.commit({ validate: true });

    if (errors) return;

    this._apiKeysCollection.create(this._apiKeyModel.attributes, {
      success: (model) => {
        this._apiKeyModel = model;
        this._generateForm();
        this.render();
      },
      error: (model, request) => {
        this._handleServerErrors(request.responseText);
        saveButton.removeClass('is-loading');
      }
    });
  },

  _handleServerErrors: function (error) {
    let message;

    if (error.indexOf('Name has already been taken') !== -1) {
      message = 'Name already exists';
    } else if (error.indexOf('Name can\'t be blank') !== -1) {
      message = 'Name can\'t be blank';
    }

    message && this._addApiKeyNameError(message);

    if (!message) {
      this._displayUnhandledError(error);
    }
  },

  _displayUnhandledError: function (errorJSON) {
    const parsed = JSON.parse(errorJSON);
    this.$('.js-error').text(parsed.errors).show();
  },

  clean: function () {
    this._userTablesModel.clearParams();
    CoreView.prototype.clean.apply(this, arguments);
  }
});
