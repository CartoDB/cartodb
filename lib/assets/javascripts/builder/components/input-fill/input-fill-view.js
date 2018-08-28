var CoreView = require('backbone/core-view');
var PopupManager = require('builder/components/popup-manager');
var FillTemplate = require('builder/components/input-fill/input-fill.tpl');
var DialogModel = require('builder/components/dialog/dialog-model');
var DialogView = require('builder/components/dialog/dialog-view');
var InputCollection = require('builder/components/input-collection/input-collection');

var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'columns',
  'query',
  'configModel',
  'userModel',
  'editorAttrs',
  'modals',
  'dialogMode',
  'popupConfig'
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

  focus: function () {
    if (this.hasFocus) return;
    this.$('.js-fillInput').focus();
  },

  blur: function () {
    if (!this.hasFocus) return;
    this.$('.js-fillInput').blur();
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

  clean: function () {
    this.removeDialog();
    this._popupManager && this._popupManager.destroy();

    CoreView.prototype.clean.call(this);
  },

  removeDialog: function () {
    if (!this._dialogView) return;

    this._popupManager.untrack();
    this._inputCollection.unselect();
    this._dialogView.clean();
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
    this._inputCollection.bind('onInputChanged', this._onInputChanged, this);
  },

  _onInputChanged: function () {
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
  }
});
