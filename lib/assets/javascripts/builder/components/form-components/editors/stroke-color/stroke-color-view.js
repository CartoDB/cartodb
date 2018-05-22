var CoreView = require('backbone/core-view');
var DialogModel = require('builder/components/dialog/dialog-model');
var DialogView = require('builder/components/dialog/dialog-view');

var InputCollection = require('builder/components/form-components/editors/fill-color/fill-color-input-collection');
var InputStrokeColor = require('builder/components/form-components/editors/stroke-color/inputs/input-stroke-color');

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
  'popupConfig',
  'strokeColorModel'
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

    this._initStrokeColorInput();
    this._inputCollection.bind('onInputChanged', this._onInputChanged, this);
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
    this.trigger('onInputChanged', this);
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
  }
});
