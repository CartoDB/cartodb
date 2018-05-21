var CoreView = require('backbone/core-view');

var InputCollection = require('builder/components/form-components/editors/fill-color/fill-color-input-collection');
var InputColorByValueView = require('builder/components/form-components/editors/fill-color/inputs/input-color-by-value');

var FillTemplate = require('builder/components/form-components/editors/fill/fill-template.tpl');
var DialogModel = require('builder/components/dialog/dialog-model');
var DialogView = require('builder/components/dialog/dialog-view');
var PopupManager = require('builder/components/popup-manager');

var FillConstants = require('builder/components/form-components/_constants/_fill');

var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'columns',
  'query',
  'configModel',
  'userModel',
  'editorAttrs',
  'modals',
  'dialogMode',
  'colorAttributes',
  'valueColorInputModel',
  'popupConfig'
];

module.exports = CoreView.extend({
  className: 'Form-InputFill CDB-OptionInput CDB-Text js-input',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initViews();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();

    return this;
  },

  _initViews: function () {
    this.$el.append(FillTemplate());

    if (this.options.editorAttrs && this.options.editorAttrs.disabled) {
      this.$el.addClass('is-disabled');
    }

    this._initDialog();
    this._initInputFields();

    this._popupManager = new PopupManager(
      this._popupConfig.cid,
      this._popupConfig.$el,
      this._dialogView.$el
    );
  },

  _initDialog: function () {
    var dialogModel = new DialogModel();

    this.listenToOnce(dialogModel, 'destroy', function () {
      this._dialogView = null;
      this.stopListening(dialogModel);
    });

    this._dialogView = new DialogView({
      model: dialogModel
    });
  },

  _initInputFields: function () {
    this._inputCollection = new InputCollection();

    this._initColorByValueInput();

    this._inputCollection.bind('onInputChanged', this._onInputChanged, this);
  },

  _initColorByValueInput: function () {
    var quantification = this._valueColorInputModel.get('quantification');

    if (quantification && FillConstants.Quantification.REFERENCE[quantification]) {
      this._valueColorInputModel.set(
        'quantification',
        FillConstants.Quantification.REFERENCE[quantification],
        { silent: true }
      );
    }

    this._valueColorInputView = new InputColorByValueView({
      model: this._valueColorInputModel,
      columns: this.options.columns,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      modals: this.options.modals,
      imageEnabled: this.options.imageEnabled,
      editorAttrs: this.options.editorAttrs ? this.options.editorAttrs : {},
      disabled: this.options.editorAttrs && this.options.editorAttrs.disabled
    });

    this._valueColorInputView.bind('click', this._onInputClick, this);
    this.$('.js-content').append(this._valueColorInputView.render().$el);

    this._inputCollection && this._inputCollection.push(this._valueColorInputModel);
  },

  removeDialog: function () {
    this._inputCollection.unselect();
    this._dialogView.clean();
    this._popupManager.untrack();
  },

  _onInputChanged: function (model) {
    this.trigger('onInputChanged', this);
  },

  _onInputClick: function (inputModel) {
    if (inputModel.get('selected')) {
      this.removeDialog();
      return;
    }

    inputModel.set('selected', true);
    this._dialogView.model.set('createContentView', inputModel.get('createContentView'));
    this._dialogView.render();
    this._dialogView.show();

    this._popupManager.append(this._dialogMode);
    this._popupManager.track();
  },

  _removeForm: function () {
    this.removeDialog();
    this._popupManager.destroy();
    this._inputCollection.unbind('onInputChanged', this._onInputChanged, this);
  },

  clean: function () {
    this._removeForm();
    CoreView.prototype.clean.call(this);
  }
});
