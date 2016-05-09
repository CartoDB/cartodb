var _ = require('underscore');
var Backbone = require('backbone');
var FillDialogModel = require('./fill/fill-dialog-model');
var FillDialogView = require('./fill/fill-dialog');

var InputCollection = require('./fill/inputs/input-collection');
var InputNumber = require('./fill/inputs/input-number');
var InputColor = require('./fill/inputs/input-color');

var template = require('./fill-template.tpl');

var INPUT_TYPE_MAP = {
  'size': InputNumber,
  'color': InputColor
};

Backbone.Form.editors.Fill = Backbone.Form.editors.Base.extend({
  className: 'CDB-OptionInput CDB-Text',

  initialize: function (opts) {
    this._inputData = {
      size: {
        range: [1, 10],
        attribute: 'the_geom',
        quantification: 'quantile'
      },
      color: {
        range: ['#FFF', '#FABADA', '#00FF00', '#000', '#99999'],
        attribute: 'name',
        bins: 6,
        operation: 'multiply', // TODO: ask where's choosen
        quantification: 'jenks',
        opacity: 0.5
      }
    };

    // fixed: '#FF0000',
    // opacity: 0.5

    this.options = {
      columns: opts.schema.columns
    };

    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);

    this._initBinds();
    this._initViews();
  },

  _initViews: function () {
    this.$el.append(template());

    this._initFillDialog();
    this._initInputFields();
  },

  _initInputFields: function () {
    var inputKlass;

    this._inputCollection = new InputCollection();

    _.each(this._inputData, function (value, key) {
      this._inputCollection.add(_.extend({ type: key }, value));
    }, this);

    this._inputCollection.each(function (inputModel) {
      var Klass = INPUT_TYPE_MAP[inputModel.get('type')];

      if (!Klass) {
        throw new Error(inputModel.get('type') + ' is not a valid type of constructor');
      }

      inputKlass = new Klass(({
        model: inputModel,
        columns: this.options.columns
      }));

      inputKlass.bind('click', this._onInputClick, this);

      this.$('.js-content').append(inputKlass.render().$el);
    }, this);
  },

  _initBinds: function () {
    this.applyESCBind(function () {
      this._removeDialog();
    });
    // TODO: enable way to close the dialog when pressing outside of it
  },

  _onInputClick: function (inputModel) {
    inputModel.set('selected', true);
    this._fillDialogView.model.set('createContentView', inputModel.get('createContentView'));
    this._fillDialogView.render();
    this._fillDialogView.show();

    this.$el.append(this._fillDialogView.$el);
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

  remove: function () {
    this._removeDialog();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
