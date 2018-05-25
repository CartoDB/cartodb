var InputFillView = require('builder/components/input-fill/input-fill-view');
var InputColorFixedView = require('builder/components/form-components/editors/fill-color/inputs/input-color-fixed');
var InputImageView = require('builder/components/form-components/editors/fill-color/inputs/input-image');

var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'columns',
  'editorAttrs',
  'dialogMode',
  'popupConfig',
  'fixedColorInputModel',
  'imageInputModel'
];

module.exports = InputFillView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    if (this._editorAttrs.imageEnabled) {
      this._configModel = this.options.configModel;
      this._userModel = this.options.userModel;
      this._modals = this.options.modals;
    }

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
      columns: this._columns,
      configModel: this._configModel,
      userModel: this._userModel,
      modals: this._modals,
      editorAttrs: this._editorAttrs || {},
      disabled: this._editorAttrs && this._editorAttrs.disabled
    });

    this._fillInputColorView.bind('click', this._onInputClick, this);
    this.$('.js-content').append(this._fillInputColorView.render().$el);

    this._inputCollection && this._inputCollection.push(this._fixedColorInputModel);
  },

  _initFillImageInput: function () {
    if (this._editorAttrs.imageEnabled) {
      this._fillInputImageView = new InputImageView({
        model: this._imageInputModel,
        columns: this._columns,
        configModel: this._configModel,
        userModel: this._userModel,
        modals: this._modals,
        query: this._query,
        editorAttrs: this._editorAttrs || {},
        disabled: this._editorAttrs && this._editorAttrs.disabled
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
