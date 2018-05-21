var CoreView = require('backbone/core-view');
var DialogModel = require('builder/components/dialog/dialog-model');
var DialogView = require('builder/components/dialog/dialog-view');

var InputCollection = require('builder/components/form-components/editors/fill-color/fill-color-input-collection');
var InputColorFixedView = require('builder/components/form-components/editors/fill-color/inputs/input-color-fixed');
var InputImageView = require('builder/components/form-components/editors/fill-color/inputs/input-image');

var FillTemplate = require('builder/components/form-components/editors/fill/fill-template.tpl');
var PopupManager = require('builder/components/popup-manager');

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
  'popupConfig',
  'fixedColorInputModel',
  'imageInputModel'
];

module.exports = CoreView.extend({
  className: 'Form-InputFill CDB-OptionInput CDB-Text js-input',

  events: {
    focus: function () {
      this.trigger('focus', this);
    },
    blur: function () {
      this.trigger('blur', this);
    }
  },

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

    this._initFillDialog();
    this._initInputFields();

    this._popupManager = new PopupManager(
      this._popupConfig.cid,
      this._popupConfig.$el,
      this._dialogView.$el
    );
  },

  _initInputFields: function () {
    this._inputCollection = new InputCollection();

    this._initFillColorInput();
    this._initFillImageInput();

    this._inputCollection.bind('onInputChanged', this._onInputChanged, this);
  },

  _initFillColorInput: function () {
    this._fillInputColorView = new InputColorFixedView({
      model: this._fixedColorInputModel,
      columns: this.options.columns,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      modals: this.options.modals,
      editorAttrs: this.options.editorAttrs ? this.options.editorAttrs : {},
      disabled: this.options.editorAttrs && this.options.editorAttrs.disabled
    });

    this._fillInputColorView.bind('click', this._onInputClick, this);
    this.$('.js-content').append(this._fillInputColorView.render().$el);

    this._inputCollection && this._inputCollection.push(this._fixedColorInputModel);
  },

  _initFillImageInput: function () {
    if (this.options.imageEnabled) {
      this._fillInputImageView = new InputImageView({
        model: this._imageInputModel,
        columns: this.options.columns,
        query: this.options.query,
        configModel: this.options.configModel,
        userModel: this.options.userModel,
        modals: this.options.modals,
        editorAttrs: this.options.editorAttrs ? this.options.editorAttrs : {},
        disabled: this.options.editorAttrs && this.options.editorAttrs.disabled
      });

      this._fillInputImageView.bind('click', this._onInputClick, this);
      this.$('.js-content').append(this._fillInputImageView.render().$el);

      this._inputCollection && this._inputCollection.push(this._imageInputModel);
    }
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

    this._popupManager.append(this.dialogMode);
    this._popupManager.track();
  },

  _onInputChanged: function (model) {
    this._adjustImageSize(model);
    this.trigger('onInputChanged', this);
  },

  _adjustImageSize: function (model) {
    // TODO
  },

  _initFillDialog: function () {
    var dialogModel = new DialogModel();

    this.listenToOnce(dialogModel, 'destroy', function () {
      this._dialogView = null;
      this.stopListening(dialogModel);
    });

    this._dialogView = new DialogView({
      model: dialogModel
    });
  },

  removeDialog: function () {
    this._inputCollection.unselect();
    this._dialogView.clean();
    this._popupManager.untrack();
  },

  focus: function () {
    if (this.hasFocus) return;
    this.$('.js-fillInput').focus();
  },

  blur: function () {
    if (!this.hasFocus) return;
    this.$('.js-fillInput').blur();
  },

  _removeForm: function () {
    this.removeDialog();
    this._popupManager.destroy();
    this._fillInputColorView.unbind('click', this._onInputClick, this);
    if (this._fillInputImageView) {
      this._fillInputImageView.unbind('click', this._onInputClick, this);
    }
    this._inputCollection.unbind('onInputChanged', this._onInputChanged, this);
  },

  clean: function () {
    this._removeForm();
    CoreView.prototype.clean.call(this);
  }
});
