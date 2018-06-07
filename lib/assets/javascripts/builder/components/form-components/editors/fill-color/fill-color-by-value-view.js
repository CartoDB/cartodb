var InputFillView = require('builder/components/input-fill/input-fill-view');
var InputColorByValueView = require('builder/components/form-components/editors/fill-color/inputs/input-color-by-value');
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
  'valueColorInputModel',
  'popupConfig'
];

module.exports = InputFillView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initViews();
  },

  _initInputFields: function () {
    InputFillView.prototype._initInputFields.call(this);

    this._initColorByValueInput();
  },

  _initColorByValueInput: function () {
    var quantification = this._valueColorInputModel.get('quantification');

    if (quantification && FillConstants.Quantification.REFERENCE[quantification]) {
      this._valueColorInputModel.set(
        'quantification',
        FillConstants.Quantification.REFERENCE[quantification], {
          silent: true
        }
      );
    }

    this._valueColorInputView = new InputColorByValueView({
      model: this._valueColorInputModel,
      columns: this.options.columns,
      hideNumericColumns: this.options.hideNumericColumns,
      removeByValueCategory: this.options.removeByValueCategory,
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

  afterRender: function () {
    this._valueColorInputView && this._valueColorInputView.afterRender();
  }
});
