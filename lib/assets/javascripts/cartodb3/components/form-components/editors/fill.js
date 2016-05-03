var _ = require('underscore');
var Backbone = require('backbone');
var FillDialogView = require('./fill/fill-dialog');
var FillDialogModel = require('./fill/fill-dialog-model');

var InputNumber = require('./fill/inputs/input-number');
var InputColor = require('./fill/inputs/input-color');

// maps the type of the fill element to the views involved
var INPUT_TYPE_MAP = {
  'marker-width': InputNumber,
  'marker-radius': InputNumber,
  'marker-fill': InputColor
};

Backbone.Form.editors.Fill = Backbone.Form.editors.Base.extend({
  className: 'CDB-OptionInput-item CDB-InputText CDB-InputFill js-content',

  initialize: function (opts) {
    this._inputData = {
      'marker-width': {
        fixed: 20
      },
      'marker-radius': {
        fixed: 10
      },
      'marker-fill': {
        fixed: '#FFF'
      }
    };

    this.options = _.extend(
      this.options,
      opts.schema.options,
      opts.schema.validators && opts.schema.validators[1]
    );

    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);

    this._initBinds();
    this._initViews();
  },

  _initViews: function () {
    this._initFillDialog();
    _.each(this._inputData, this._initInputs, this);
  },

  _initInputs: function (val, key) {
    var Klass = INPUT_TYPE_MAP[key];
    var inputKlass = new Klass(val);

    this.$el.append(inputKlass.render().$el);
    inputKlass.bind('click', this._onInputClick, this);
  },

  _initBinds: function () {
    this.applyESCBind(function () {
      this._removeDialog();
    });
    //  this.applyClickOutsideBind(function () { // TODO: enable way to close the dialog when pressing outside of it
    //    this._removeDialog();
    //  });
  },

  _onInputClick: function (createContentView) {
    this._fillDialogView.model.set('createContentView', createContentView);
    this._fillDialogView.render();
    this._fillDialogView.show();

    document.body.appendChild(this._fillDialogView.el);
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
    this._fillDialogView.remove(); // TODO: remove or hide?
  },

  remove: function () {
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
