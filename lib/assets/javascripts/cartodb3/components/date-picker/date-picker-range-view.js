var cdb = require('cartodb.js');
var _ = require('underscore');
var moment = require('moment');
var $ = require('jquery');
var Backbone = require('backbone');
var Utils = require('../../helpers/utils');
require('../form-components/index');
require('datepicker');
var datePickerTemplate = require('./date-picker-range-form.tpl');
var template = require('./date-picker-range.tpl');
var MAX_RANGE = 30;

/**
 * Custom picer for a dates range.
 */
module.exports = cdb.core.View.extend({

  className: 'DatePicker',

  options: {
    flat: true,
    date: ['2008-07-31', '2008-07-31'],
    current: '2008-07-31',
    calendars: 2,
    mode: 'range',
    starts: 1
  },

  events: {
    'click .js-dates': '_toggleCalendar',
    'click .js-fourHours': '_setLastFourHours',
    'click .js-oneDay': '_setLastDay',
    'click .js-oneWeek': '_setLastWeek'
  },

  initialize: function (opts) {
    this.model = new cdb.core.Model({
      fromDate: '',
      fromHour: 0,
      fromMin: 0,
      toDate: '',
      toHour: 23,
      toMin: 59,
      user_timezone: 0 // Explained as GMT+0
    });

    this.template = opts.template || template;
    this._initBinds();
    this._setDefaultDate();
  },

  render: function () {
    var self = this;

    this.clearSubViews();

    this.$el.append(
      this.template(
        _.extend(
          this.model.attributes,
          {
            max_days: MAX_RANGE,
            pad: Utils.pad
          }
        )
      )
    );

    setTimeout(function () {
      self._initCalendar();
      self._hideCalendar();
      self._initTimers();
    }, 100);

    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this._setValues, this);
    this.model.bind('change', this._onValuesChange, this);
    $(document).bind('click', this._onDocumentClick.bind(this));
  },

  _destroyBinds: function () {
    $(document).unbind('click', this._onDocumentClick.bind(this));
  },

  _setValues: function (m, c) {
    var text = _t('components.datepicker.dates-placeholder');
    var data = this.model.attributes;

    if (data.fromDate && data.toDate) {
      text =
        _t('components.datepicker.from') + ' ' +
        '<strong>' +
        this.model.get('fromDate') + ' ' +
        (Utils.pad(this.model.get('fromHour'), 2) + ':' + Utils.pad(this.model.get('fromMin'), 2)) +
        '</strong>' +
        ' ' + _t('components.datepicker.to') + ' ' +
        '<strong>' +
        this.model.get('toDate') + ' ' +
        (Utils.pad(this.model.get('toHour'), 2) + ':' + Utils.pad(this.model.get('toMin'), 2)) +
        '</strong>' +
        '<i class="CDB-IconFont CDB-IconFont-calendar DatePicker-datesIcon"></i>';
    }

    this.$('.DatePicker-dates').html(text);
  },

  _setDefaultDate: function () {
    var datesUTC = this.model.get('user_timezone');
    var today = moment().utc(datesUTC);
    var previous = moment().utc(datesUTC).subtract((MAX_RANGE - 1), 'days');
    this.options.date = [previous.format('YYYY-MM-DD'), today.format('YYYY-MM-DD')];
    this.options.current = today.format('YYYY-MM-DD');
    this._setModelFromPrevious(previous);
  },

  _initCalendar: function () {
    var selector = '.DatePicker-calendar';

    // Can't initialize calendar if not already present in document... avoid errors being thrown
    if (!document.body.contains(this.$(selector)[0])) return;

    this.calendar = this.$(selector).DatePicker(
      _.extend(this.options, {
        onChange: this._onDatesChange.bind(this),
        onRender: function (d) { // Disable future dates and dates < MAX_RANGE days ago
          var date = d.valueOf();
          var now = new Date();

          var thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - MAX_RANGE);

          return (date < thirtyDaysAgo) || (date > now) ? { disabled: true } : '';
        }
      })
    );
  },

  _onDatesChange: function (formatted, dates) {
    // Check if selected dates have more than MAX_RANGE days
    var start = moment(formatted[0]);
    var end = moment(formatted[1]);

    if (Math.abs(start.diff(end, 'days')) > MAX_RANGE) {
      formatted[1] = moment(formatted[0]).add('days', MAX_RANGE).format('YYYY-MM-DD');
      this.$('.DatePicker-calendar').DatePickerSetDate([formatted[0], formatted[1]]);
    }

    this.model.set({
      fromDate: formatted[0],
      toDate: formatted[1]
    });
  },

  _hideCalendar: function (e) {
    if (e) this.killEvent(e);
    this.$('.DatePicker-dropdown').hide();
  },

  _toggleCalendar: function (ev) {
    if (ev) this.killEvent(ev);
    this.$('.DatePicker-dropdown').toggle();
  },

  _setLastFourHours: function () {
    var previous = moment().utc(0).subtract(4, 'hours');
    this._setModelFromPrevious(previous);
    this._setDatepickerFromPrevious(previous);
    this.closeCalendar();
  },

  _setLastDay: function () {
    var previous = moment().utc(0).subtract(1, 'day');
    this._setModelFromPrevious(previous);
    this._setDatepickerFromPrevious(previous);
    this.closeCalendar();
  },

  _setLastWeek: function () {
    var previous = moment().utc(0).subtract(1, 'week');
    this._setModelFromPrevious(previous);
    this._setDatepickerFromPrevious(previous);
    this.closeCalendar();
  },

  _setModelFromPrevious: function (previous) {
    var today = moment().utc(0);

    this.model.set({
      fromDate: previous.format('YYYY-MM-DD'),
      fromHour: parseInt(previous.format('H'), 10),
      fromMin: parseInt(previous.format('m'), 10),
      toDate: today.format('YYYY-MM-DD'),
      toHour: parseInt(today.format('H'), 10),
      toMin: parseInt(today.format('m'), 10)
    });
  },

  _setDatepickerFromPrevious: function (previous) {
    var today = moment().utc(0);
    this.$('.DatePicker-calendar').DatePickerSetDate([ previous.format('YYYY-MM-DD'), today.format('YYYY-MM-DD') ]);
  },

  _initTimers: function () {
    var generateNumberType = function (min, max) {
      return {
        type: 'Number',
        validators: ['required', {
          type: 'interval',
          min: min,
          max: max
        }]
      };
    };

    this.model.schema = {
      fromHour: generateNumberType(0, 23),
      fromMin: generateNumberType(0, 59),
      toHour: generateNumberType(0, 23),
      toMin: generateNumberType(0, 59)
    };

    this._datesForm = new Backbone.Form({
      model: this.model,
      template: datePickerTemplate
    });

    this._datesForm.bind('change', function () {
      this.commit();
    });
    this.$('.js-timers').append(this._datesForm.render().el);
  },

  _onValuesChange: function () {
    this.trigger('changeDate', this.model.toJSON(), this);
  },

  getDates: function () {
    return this.model.toJSON();
  },

  closeCalendar: function () {
    this.$('.DatePicker-dropdown').hide();
  },

  _onDocumentClick: function (e) {
    var $el = $(e.target);

    if ($el.closest('.DatePicker').length === 0) {
      this.closeCalendar();
    }
  },

  clean: function () {
    this._datesForm.remove();
    this._destroyBinds();
    this.closeCalendar();
    this.$('.DatePicker-calendar').DatePickerHide();
    cdb.core.View.prototype.clean.call(this);
  }

});
