var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var moment = require('moment');
var $ = require('jquery');
var Utils = require('../../helpers/utils');
require('../form-components/index');
require('datepicker');
var template = require('./date-picker.tpl');

/**
 * Custom picer for a dates range.
 */
module.exports = CoreView.extend({

  className: 'DatePicker',

  options: {
    flat: true,
    date:'2008-07-31',
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
    var self = this;

    this.clearSubViews();

    this.$el.append(this.template({
      readOnly: this.model.get('readOnly'),
      date: this.options.date
    }));

    setTimeout(function () {
      self._initCalendar();
      self._hideCalendar();
    }, 100);

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

  _initCalendar: function () {
    var self = this;

    this._$calendar().DatePicker(
      _.extend(this.options, this.model.attributes, {
        onChange: function(formatted, date) {
          self.model.set('value', formatted);
          self.$('.js-date-str').text(formatted);
          self.closeCalendar();
        },
        onRender: function (d) { // Disable future dates and dates
          var date = d.valueOf();
          var now = new Date();

          return (date > now) ? { disabled: true } : '';
        }
      })
    );
  },

  _$calendar: function() {
    return this.$('.js-calendar');
  },

  _hideCalendar: function (e) {
    if (e) this.killEvent(e);
    this.$('.js-DatePicker-simpleDropdown').hide();
  },

  _toggleCalendar: function (ev) {
    if (ev) this.killEvent(ev);
    this.$('.js-DatePicker-simpleDropdown').toggle();
  },

  closeCalendar: function () {
    this.$('.js-DatePicker-simpleDropdown').hide();
  },

  _onDocumentClick: function (e) {
    var $el = $(e.target);

    if ($el.closest('.DatePicker').length === 0) {
      this.closeCalendar();
    }
  },

  clean: function () {
    this._destroyBinds();
    this.closeCalendar();
    this.$('.js-calendar').DatePickerHide();
    CoreView.prototype.clean.call(this);
  }

});
