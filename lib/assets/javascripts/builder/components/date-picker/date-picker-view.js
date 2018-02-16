var CoreView = require('backbone/core-view');
var _ = require('underscore');
var moment = require('moment');
var $ = require('jquery');
require('builder/components/form-components/index');
require('datepicker');
var template = require('./date-picker.tpl');

/**
 * Custom picer for a dates range.
 */
module.exports = CoreView.extend({

  className: 'DatePicker',

  options: {
    flat: true,
    date: '2008-07-31',
    current: '2008-07-31',
    calendars: 1,
    starts: 1
  },

  events: {
    'click .js-dates': '_toggleCalendar'
  },

  initialize: function (opts) {
    this.template = opts.template || template;
    this._initBinds();
    this._setDefaultDate();
  },

  render: function () {
    this.clearSubViews();

    this.$el.append(this.template({
      readOnly: this.model.get('readOnly'),
      date: this.options.date
    }));

    if (this.model.get('readOnly')) {
      this.undelegateEvents();
    }

    return this;
  },

  _initBinds: function () {
    $(document).bind('click', this._onDocumentClick.bind(this));
  },

  _destroyBinds: function () {
    $(document).unbind('click', this._onDocumentClick.bind(this));
  },

  _setDefaultDate: function () {
    var utc = new Date().getTimezoneOffset();
    var today = moment(new Date()).utcOffset(utc).format('YYYY-MM-DD');
    this.options.date = this.model.get('value') && moment(this.model.get('value')).format('YYYY-MM-DD') || today;
    this.options.current = this.options.date;
  },

  _$calendar: function () {
    return this.$('.js-calendar');
  },

  _$dropdown: function () {
    return this.$('.js-DatePicker-simpleDropdown');
  },

  _hideCalendar: function (ev) {
    if (ev) {
      this.killEvent(ev);
    }
    this.model.set('visible', false);
    this._destroyCalendar();
    this._$dropdown().hide();
  },

  _showCalendar: function () {
    this.model.set('visible', true);

    this._$calendar().DatePicker(
      _.extend(this.options, this.model.attributes, {
        onChange: function (formatted, date) {
          this.model.set('value', formatted);
          this.$('.js-date-str').text(formatted);
          this._hideCalendar();
        }.bind(this),
        onRender: function (d) { // Disable future dates and dates
          var date = d.valueOf();
          var now = new Date();

          return (date > now) ? { disabled: true } : '';
        }
      })
    );

    this._$dropdown().show();
  },

  _destroyCalendar: function () {
    if (this.$('.DatePicker').length > 0) {
      this._$calendar() && this._$calendar().DatePickerHide();
    }
  },

  _toggleCalendar: function (ev) {
    if (ev) {
      this.killEvent(ev);
    }

    this.model.get('visible') ? this._hideCalendar() : this._showCalendar();
  },

  closeCalendar: function () {
    this._hideCalendar();
  },

  _onDocumentClick: function (e) {
    var $el = $(e.target);

    if ($el.closest('.DatePicker').length === 0) {
      this._hideCalendar();
    }
  },

  clean: function () {
    this._destroyBinds();
    this._hideCalendar();
    CoreView.prototype.clean.call(this);
  }

});
