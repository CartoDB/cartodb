var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

var FillDialogModel = require('builder/components/form-components/editors/fill/fill-dialog-model');
var FillDialogView = require('builder/components/form-components/editors/fill/fill-dialog');

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

    this.options = _.extend(
      this.options,
      {
        columns: this.options.options,
        query: this.options.query,
        configModel: this.options.configModel,
        userModel: this.options.userModel,
        editorAttrs: this.options.editorAttrs,
        modals: this.options.modals
      }
    );

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
    var inputColorAttributes = this.model.get('fillColor').color;
    this._inputColorModel = new Backbone.Model(inputColorAttributes);

    this._inputColorModel.bind('click', this._onInputClick, this);
    this._inputColorModel.on('change', this._onInputChanged, this);

    var inputColorSolidView = new InputColorSolidView({
      model: this._inputColorModel,
      columns: this.options.columns,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      modals: this.options.modals,
      editorAttrs: this.options.editorAttrs ? this.options.editorAttrs.color : {},
      disabled: this.options.editorAttrs && this.options.editorAttrs.disabled
    });

    this.$('.js-content').append(inputColorSolidView.render().$el);

    var inputImageView = new InputImageView({
      model: this._inputColorModel,
      columns: this.options.columns,
      query: this.options.query,
      configModel: this.options.configModel,
      userModel: this.options.userModel,
      modals: this.options.modals,
      editorAttrs: this.options.editorAttrs ? this.options.editorAttrs.image : {},
      disabled: this.options.editorAttrs && this.options.editorAttrs.disabled
    });

    this.$('.js-content').append(inputImageView.render().$el);
  },

  _initBinds: function () {
    this.applyESCBind(function () {
      this._removeDialog();
    });
    this.applyClickOutsideBind(function () {
      this._removeDialog();
    });
  },

  _onInputClick: function (input) {
    if (input.model.get('selected')) {
      this._removeDialog();
      return;
    }

    input.model.set('selected', true);
    this._fillDialogView.model.set('createContentView', input.model.get('createContentView'));
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
    if (model.get('type') !== 'color' && model.get('kind') !== 'marker') {
      return;
    }

    var changedImage = model.get('image') && model.hasChanged('image') && !model.previous('image');
    var hasImages = _.isEmpty(_.compact(model.get('images')));
    var hadImages = _.isEmpty(_.compact(model.previous('images')));
    var changedImages = !hasImages && model.hasChanged('images') && hadImages;
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
    this._inputColorModel.set('selected', false);
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

  getValue: function () {
    // return this._inputCollection.getValues(); FIXME
  },

  setValue: function (value) {
    // TODO: add setter
  },

  remove: function () {
    this._removeDialog();
    this._inputColorModel.unbind('click', this._onInputClick, this);
    this._popupManager.destroy();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
