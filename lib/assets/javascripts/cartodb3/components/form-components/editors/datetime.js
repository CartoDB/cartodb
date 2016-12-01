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

    this._removeDateTimeDialog();

    this.$el.html(
      template({
        value: this._getFormattedDatetime()
      })
    );

    this._initViews();

    return this;
  },

  _getFormattedDatetime: function () {
    if (this.value) {
      var value = new Date(this.value).toUTCString();
      var momentObj = moment(value).utc();
      return momentObj.format('YYYY-MM-DD') + 'T' + momentObj.format('HH:mm:ss') + 'Z';
    }

    return '';
  },

  _initViews: function () {
    if (this.options.editorAttrs && this.options.editorAttrs.disabled) {
      this.$el.addClass('is-disabled');
    }

    this._datetimeDialogModel = new DatetimeDialogModel({
      value: this._getFormattedDatetime()
    });
    this._datetimeDialogModel.bind('change:value', this._onInputChanged, this);

    this._datetimeDialogView = new DatetimeDialogView({
      model: this._datetimeDialogModel
    });
  },

  _initBinds: function () {
    this.applyESCBind(function () {
      this._removeDateTimeDialog();
    });
    this.applyClickOutsideBind(function () {
      this._removeDateTimeDialog();
    });
  },

  _onInputClick: function () {
    this.$el.append(this._datetimeDialogView.render().el);
  },

  _removeDateTimeDialog: function () {
    if (this._datetimeDialogView) {
      this._datetimeDialogView.remove();
    }
  },

  _onInputChanged: function (mdl) {
    var value = this._datetimeDialogModel.get('value');
    this.setValue(value);

    this.trigger('change', this);
  },

  _updateInput: function (value) {
    this.$('.js-input')
      .toggleClass('is-empty', !value)
      .text(value);
  },

  getValue: function () {
    return this._datetimeDialogModel.get('value');
  },

  setValue: function (value) {
    this._updateInput(value);
    this.value = value;
  },

  remove: function () {
    this._removeDateTimeDialog();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
