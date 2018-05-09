var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

var FillDialogModel = require('builder/components/form-components/editors/fill/fill-dialog-model');
var FillDialogView = require('builder/components/form-components/editors/fill/fill-dialog');

var InputCollection = require('builder/components/form-components/editors/fill/fill-color/input-collection');
var InputColorSolidView = require('builder/components/form-components/editors/fill/fill-color/input-color-solid/input-color-solid');
var InputImageView = require('builder/components/form-components/editors/fill/fill-color/input-img/input-img');

var template = require('builder/components/form-components/editors/fill/fill-template.tpl');

var PopupManager = require('builder/components/popup-manager');

var QUANTIFICATION_REF = {
  'Jenks': 'jenks',
  'Equal Interval': 'equal',
  'Heads/Tails': 'headtails',
  'Quantile': 'quantiles'
};

var INPUT_TYPE_MAP = {
  image: InputImageView,
  color: InputColorSolidView
};

Backbone.Form.editors.FillColor = Backbone.Form.editors.Base.extend({
  className: 'Form-InputFill CDB-OptionInput CDB-Text js-input',

  events: {
    focus: function () {
      this.trigger('focus', this);
    },
    blur: function () {
      this.trigger('blur', this);
    }
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts); // Options

    this.options = _.extend(this.options, {
      columns: this.options.options,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      editorAttrs: this.options.editorAttrs,
      modals: this.options.modals
    });

    this._keyAttr = opts.key;
    this.dialogMode = this.options.dialogMode || 'nested';

    this._initBinds();
    this._initViews();
  },

  _initViews: function () {
    this.$el.append(template());

    if (this.options.editorAttrs && this.options.editorAttrs.disabled) {
      this.$el.addClass('is-disabled');
    }

    this._initFillDialog();
    this._initInputFields();

    this._popupManager = new PopupManager(this.cid, this.$el, this._fillDialogView.$el);
  },

  _initInputFields: function () {
    var colorAttributes = _.clone(this.model.get(this.key));

    this._inputCollection = new InputCollection();
    this._inputCollection.add(_.extend({ type: 'image' }, colorAttributes));
    this._inputCollection.add(_.extend({ type: 'color' }, colorAttributes));

    this._inputCollection.each(function (inputModel) {
      var type = inputModel.get('type');

      var InputTypeView = INPUT_TYPE_MAP[type];

      if (!InputTypeView) {
        throw new Error(type + ' is not a valid type of constructor');
      }

      if (inputModel.get('quantification') && QUANTIFICATION_REF[inputModel.get('quantification')]) {
        inputModel.set('quantification', QUANTIFICATION_REF[inputModel.get('quantification')], { silent: true });
      }

      var inputTypeView = new InputTypeView({
        model: inputModel,
        columns: this.options.columns,
        query: this.options.query,
        configModel: this.options.configModel,
        userModel: this.options.userModel,
        modals: this.options.modals,
        editorAttrs: this.options.editorAttrs ? this.options.editorAttrs[type] : {},
        disabled: this.options.editorAttrs && this.options.editorAttrs.disabled
      });

      inputTypeView.bind('click', this._onInputClick, this);

      this.$('.js-content').append(inputTypeView.render().$el);
    }, this);

    this._inputCollection.bind('onInputChanged', this._onInputChanged, this);
  },

  _initBinds: function () {
    this.applyESCBind(this._removeDialog);
    this.applyClickOutsideBind(this._removeDialog);
  },

  _onInputClick: function (inputModel) {
    if (inputModel.get('selected')) {
      this._removeDialog();
      return;
    }

    inputModel.set('selected', true);
    this._fillDialogView.model.set('createContentView', inputModel.get('createContentView'));
    this._fillDialogView.render();
    this._fillDialogView.show();

    this._popupManager.append(this.dialogMode);
    this._popupManager.track();
  },

  _onInputChanged: function (model) {
    this._adjustImageSize(model);
    this.trigger('change', this);
  },

  _adjustImageSize: function (model) {
    // TODO
  },

  _initFillDialog: function () {
    var fillDialogModel = new FillDialogModel();

    this.listenToOnce(fillDialogModel, 'destroy', function () {
      this._fillDialogView = null;
      this.stopListening(fillDialogModel);
    });

    this._fillDialogView = new FillDialogView({
      model: fillDialogModel
    });
  },

  _removeDialog: function (dialog) {
    this._inputCollection.unselect();
    this._fillDialogView.clean();
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

  getValue: function (param) {
    return this._inputCollection.getValues();
  },

  setValue: function (value) {
    // TODO: add setter
  },

  remove: function () {
    this._removeDialog();
    this._popupManager.destroy();
    this._inputCollection.unbind('onInputChanged', this._onInputChanged, this);
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
