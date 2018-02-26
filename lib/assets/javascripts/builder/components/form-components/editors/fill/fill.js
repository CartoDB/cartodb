var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');

var FillDialogModel = require('./fill-dialog-model');
var FillDialogView = require('./fill-dialog');

var InputCollection = require('./input-collection');
var InputNumber = require('./input-number/input-number');
var InputColor = require('./input-color/input-color');

var template = require('./fill-template.tpl');

var PopupManager = require('builder/components/popup-manager');

var INPUT_TYPE_MAP = {
  'size': InputNumber,
  'color': InputColor,
  'image': InputColor
};

var QUANTIFICATION_REF = {
  'Jenks': 'jenks',
  'Equal Interval': 'equal',
  'Heads/Tails': 'headtails',
  'Quantile': 'quantiles'
};

var MIN_IMAGE_SIZE = 20;
var MIN_MARKER_SIZE = 7;

Backbone.Form.editors.Fill = Backbone.Form.editors.Base.extend({
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
    var inputKlass;

    this._inputCollection = new InputCollection();

    _.each(this.model.get(this._keyAttr), function (value, key) {
      this._inputCollection.add(_.extend({ type: key }, value));
    }, this);

    this._inputCollection.each(function (inputModel) {
      var type = inputModel.get('type');

      var Klass = INPUT_TYPE_MAP[type];

      if (!Klass) {
        throw new Error(type + ' is not a valid type of constructor');
      }

      if (inputModel.get('quantification') && QUANTIFICATION_REF[inputModel.get('quantification')]) {
        inputModel.set('quantification', QUANTIFICATION_REF[inputModel.get('quantification')], { silent: true });
      }

      inputKlass = new Klass(({
        model: inputModel,
        columns: this.options.columns,
        query: this.options.query,
        configModel: this.options.configModel,
        userModel: this.options.userModel,
        modals: this.options.modals,
        editorAttrs: this.options.editorAttrs ? this.options.editorAttrs[type] : {},
        disabled: this.options.editorAttrs && this.options.editorAttrs.disabled
      }));

      inputKlass.bind('click', this._onInputClick, this);

      this.$('.js-content').append(inputKlass.render().$el);
    }, this);

    this._inputCollection.bind('inputChanged', this._onInputChanged, this);
  },

  _initBinds: function () {
    this.applyESCBind(function () {
      this._removeDialog();
    });
    this.applyClickOutsideBind(function () {
      this._removeDialog();
    });
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
    if (model.get('type') !== 'color' && model.get('kind') !== 'marker') {
      return;
    }

    var size = this._inputCollection.findWhere({ type: 'size' });

    if (!model.get('image') && model.hasChanged('image') && model.previous('image')) {
      size.set('fixed', MIN_MARKER_SIZE);
      return;
    }

    if (!model.get('images') && model.hasChanged('images')) {
      size.set('fixed', MIN_MARKER_SIZE);
      return;
    }

    var changedImage = model.get('image') && model.hasChanged('image') && !model.previous('image');
    var hasImages = _.isEmpty(_.compact(model.get('images')));
    var hadImages = _.isEmpty(_.compact(model.previous('images')));
    var changedImages = !hasImages && model.hasChanged('images') && hadImages;

    if (changedImage || changedImages) {
      if (size && size.get('fixed') < MIN_IMAGE_SIZE) {
        size.set('fixed', MIN_IMAGE_SIZE);
      }
    }
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

  getValue: function () {
    return this._inputCollection.getValues();
  },

  setValue: function (value) {
    // TODO: add setter
  },

  remove: function () {
    this._removeDialog();
    this._popupManager.destroy();
    this._inputCollection.unbind('inputChanged', this._onInputChanged, this);
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
