var InputFillView = require('builder/components/input-fill/input-fill-view');
var InputColorFixedView = require('builder/components/form-components/editors/fill-color/inputs/input-color-fixed');
var InputImageView = require('builder/components/form-components/editors/fill-color/inputs/input-image');

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

module.exports = InputFillView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initViews();
  },

  _initInputFields: function () {
    InputFillView.prototype._initInputFields.call(this);

    this._initFillColorInput();
    this._initFillImageInput();
  },

  _initFillColorInput: function () {
    this._fillInputColorView = new InputColorFixedView({
      model: this._fixedColorInputModel,
      columns: this.options.columns,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      modals: this.options.modals,
      editorAttrs: this.options.editorAttrs || {},
      disabled: this.options.editorAttrs && this.options.editorAttrs.disabled
    });

    this._fillInputColorView.bind('click', this._onInputClick, this);
    this.$('.js-content').append(this._fillInputColorView.render().$el);

    this._inputCollection && this._inputCollection.push(this._fixedColorInputModel);
  },

  _initFillImageInput: function () {
    if (this.options.imageEnabled && this.options.editorAttrs.imageEnabled) {
      this._fillInputImageView = new InputImageView({
        model: this._imageInputModel,
        columns: this.options.columns,
        query: this.options.query,
        configModel: this.options.configModel,
        userModel: this.options.userModel,
        modals: this.options.modals,
        editorAttrs: this.options.editorAttrs || {},
        disabled: this.options.editorAttrs && this.options.editorAttrs.disabled
      });

      this._fillInputImageView.bind('click', this._onInputClick, this);
      this.$('.js-content').append(this._fillInputImageView.render().$el);

      this._inputCollection && this._inputCollection.push(this._imageInputModel);
    }
  },

  _unbindFormInputs: function () {
    this._fillInputColorView.unbind('click', this._onInputClick, this);
    if (this._fillInputImageView) {
      this._fillInputImageView.unbind('click', this._onInputClick, this);
    }
    this._inputCollection.unbind('onInputChanged', this._onInputChanged, this);
  },

  clean: function () {
    this._unbindFormInputs();
    InputFillView.prototype.clean.call(this);
  }
});
