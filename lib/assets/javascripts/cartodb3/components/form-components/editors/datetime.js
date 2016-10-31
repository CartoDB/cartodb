var _ = require('underscore');
var Backbone = require('backbone');
var moment = require('moment');

var DatetimeDialogModel = require('./datetime/datetime-dialog-model');
var DatetimeDialogView = require('./datetime/datetime-dialog-view');
var template = require('./datetime.tpl');

Backbone.Form.editors.DateTime = Backbone.Form.editors.Base.extend({
  className: 'Editor-formInput u-flex u-alignCenter',

  events: {
    'click .js-input': '_onInputClick'
  },

  initialize: function (opts) {
    this.options = {
      editorAttrs: opts.schema.editorAttrs
    };

    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);

    this._initBinds();
    this.render();
  },

  render: function () {
    Backbone.Form.editors.Base.prototype.render.apply(this, arguments);

    this.$el.html(
      template({
        value: this._getFormattedDatetime(this.value)
      })
    );
    this._initViews();

    return this;
  },

  _getFormattedDatetime: function (dateStr) {
    var momentObj = moment(dateStr).utc();
    return momentObj.format("YYYY-MM-DD") + 'T' + momentObj.format("HH:mm:ss") + 'Z';
  },

  _initViews: function () {
    if (this.options.editorAttrs && this.options.editorAttrs.disabled) {
      this.$el.addClass('is-disabled');
    }

    this._initDatetimeDialog();
  },

  _initBinds: function () {
    this.applyESCBind(function () {
      this._removeDialog();
    });
    this.applyClickOutsideBind(function () {
      this._removeDialog();
    });
  },

  _onInputClick: function () {
    this.$el.append(this._datetimeDialogView.render().el);
  },

  _removeDialog: function () {
    this._datetimeDialogView.remove();
    // this._datetimeDialogModel.unbind('inputChanged', this._onInputChanged, this);
  },

  _onInputChanged: function (mdl) {
    var value = this._datetimeDialogModel.get('value');
    this.setValue(value);

    this.trigger('change', this);
  },

  _updateInput: function (value) {
    this.$('.js-input').text(value);
  },

  _initDatetimeDialog: function () {
    this._datetimeDialogModel = new DatetimeDialogModel({
      value: this.value
    });
    this._datetimeDialogModel.bind('inputChanged', this._onInputChanged, this);

    this._datetimeDialogView = new DatetimeDialogView({
      model: this._datetimeDialogModel
    });
  },

  getValue: function () {
    return this._datetimeDialogModel.get('value');
  },

  setValue: function (value) {
    this._updateInput(value);
    this.value = value;
  },

  remove: function () {
    this._removeDialog();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
