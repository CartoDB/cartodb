var Backbone = require('backbone');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
var moment = require('moment');

var DatetimeDialogModel = require('./datetime-dialog-model');
var DatetimeDialogView = require('./datetime-dialog-view');
var template = require('./datetime.tpl');

var PopupManager = require('builder/components/popup-manager');

Backbone.Form.editors.DateTime = Backbone.Form.editors.Base.extend({
  className: 'Editor-formInput u-flex u-alignCenter',

  events: {
    'click .js-input': '_onInputClick'
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    this.dialogMode = this.options.dialogMode || 'nested';
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

    // for datetime type, empty '' value raises an error on Postgres
    return null;
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

    this._popupManager = new PopupManager(this.cid, this.$el, this._datetimeDialogView.$el);
  },

  _initBinds: function () {
    var hide = function () {
      this._removeDateTimeDialog();
    }.bind(this);
    this.applyESCBind(hide);
    this.applyClickOutsideBind(hide);
  },

  _onInputClick: function () {
    this._datetimeDialogView.render();
    this._popupManager.append(this.dialogMode);
    this._popupManager.track();
  },

  _removeDateTimeDialog: function () {
    if (this._datetimeDialogView) {
      this._popupManager.untrack();
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
    this._popupManager && this._popupManager.destroy();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  }
});
