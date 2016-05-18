var _ = require('underscore');
var Backbone = require('backbone');

var FillDialogModel = require('./fill/fill-dialog-model');
var FillDialogView = require('./fill/fill-dialog');

var InputCollection = require('./fill/input-collection');
var InputNumber = require('./fill/input-number/input-number');
var InputColor = require('./fill/input-color/input-color');

var template = require('./fill-template.tpl');

var INPUT_TYPE_MAP = {
  'size': InputNumber,
  'color': InputColor
};

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
    this.options = {
      columns: opts.schema.options,
      editorAttrs: opts.schema.editorAttrs
    };

    this._keyAttr = opts.key;

    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);

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

      inputKlass = new Klass(({
        model: inputModel,
        columns: this.options.columns,
        editorAttrs: this.options.editorAttrs ? this.options.editorAttrs[type] : {},
        disabled: this.options.editorAttrs && this.options.editorAttrs.disabled
      }));

      inputKlass.bind('click', this._onInputClick, this);

      this.$('.js-content').append(inputKlass.render().$el);
    }, this);

    this._inputCollection.bind('inputChanged', _.debounce(this._onInputChanged.bind(this), 250));
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

    this.$el.append(this._fillDialogView.$el);
  },

  _onInputChanged: function (mdl) {
    this.trigger('change', this);
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
    this._fillDialogView.remove();
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
    this._inputCollection.unbind('inputChanged', _.debounce(this._onInputChanged.bind(this), 50));
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
