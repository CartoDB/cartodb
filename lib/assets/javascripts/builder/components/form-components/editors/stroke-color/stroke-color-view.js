var InputFillView = require('builder/components/input-fill/input-fill-view');
var InputStrokeColor = require('builder/components/form-components/editors/stroke-color/inputs/input-stroke-color');

var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'columns',
  'query',
  'configModel',
  'userModel',
  'editorAttrs',
  'modals',
  'dialogMode',
  'popupConfig',
  'strokeColorModel'
];

module.exports = InputFillView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initViews();
  },

  _initInputFields: function () {
    InputFillView.prototype._initInputFields.call(this);

    this._initStrokeColorInput();
  },

  _initStrokeColorInput: function () {
    this._inputStrokeColorView = new InputStrokeColor({
      model: this._strokeColorModel,
      columns: this.options.columns,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      modals: this.options.modals,
      editorAttrs: this.options.editorAttrs || {}
    });

    this._inputStrokeColorView.bind('click', this._onInputClick, this);

    this.$('.js-content').append(this._inputStrokeColorView.render().$el);
    this._inputCollection && this._inputCollection.push(this._strokeColorModel);
  }
});
