var _ = require('underscore');
var Backbone = require('backbone');
var FillDialogView = require('./fill/fill-dialog');
var FillDialogModel = require('./fill/fill-dialog-model');
var InputNumber = require('./fill/inputs/input-number');

var INPUT_TYPE_MAP = {
  default: [InputNumber, InputNumber]
};

Backbone.Form.editors.Fill = Backbone.Form.editors.Base.extend({
  className: 'CDB-OptionInput-item CDB-InputText CDB-InputFill js-content',

  initialize: function (opts) {
    this.options = _.extend(
      this.options,
      opts.schema.options,
      opts.schema.validators && opts.schema.validators[1]
    );

    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);

    this._initViews();
  },

  _initViews: function () {
    this._addFillDialog();

    var inputs = INPUT_TYPE_MAP['default'];

    _.each(inputs, function (Klass) {
      var inputKlass = new Klass({
        value: 20 // TODO: replace
      });
      this.$el.append(inputKlass.render().$el);
      inputKlass.bind('click', this._onInputClick, this);
    }, this);
  },

  _onInputClick: function (createContentView) {
    this._fillDialogView.model.set('createContentView', createContentView);
    this._fillDialogView.render();
    this._fillDialogView.show();

    document.body.appendChild(this._fillDialogView.el);
  },

  _addFillDialog: function () {
    var fillDialogModel = new FillDialogModel();

    this.listenToOnce(fillDialogModel, 'destroy', function () {
      this._fillDialogView = null;
      this.stopListening(fillDialogModel);
    });

    this._fillDialogView = new FillDialogView({
      model: fillDialogModel
    });

    this._destroyOnEsc(this._fillDialogView);
  },

  _destroyOnEsc: function (dialog) {
    var destroyOnEsc = function (ev) {
      if (ev.keyCode === 27) {
        dialog.remove();
      }
    };
    document.addEventListener('keydown', destroyOnEsc);
    this.listenToOnce(dialog, 'destroy', function () {
      document.removeEventListener('keydown', destroyOnEsc);
    });
  },

  remove: function () {
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
