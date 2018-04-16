var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
cdb.admin = require('cdb.admin');
var moment = require('moment-v3');
var Spinner = require('../../forms/spinner');


/**
 * Custom picer for a dates range.
 */
module.exports = cdb.core.View.extend({

  _MAX_RANGE: 30,
  _FOUR_HOURS: { amount: 4, unit: 'hours' },
  _ONE_DAY: { amount: 1, unit: 'day' },
  _ONE_WEEK: { amount: 1, unit: 'week' },

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
    'click .js-fourHours': function () { this._setPreviousTime(this._FOUR_HOURS); },
    'click .js-oneDay': function () { this._setPreviousTime(this._ONE_DAY); },
    'click .js-oneWeek': function () { this._setPreviousTime(this._ONE_WEEK); }
  },

  initialize: function() {
    var isDisabled = (this.options && this.options.disabled) ? this.options.disabled : false;

    // Generate model
    this.model = new cdb.core.Model({
      fromDate: '',
      fromHour: 0,
      fromMin:  0,
      toDate: '',
      toHour: 23,
      toMin:  59,
      user_timezone: 0, // Explained as GMT+0
      disabled: isDisabled
    });

    this.template = this.options.template || cdb.templates.getTemplate('common/views/date_pickers/dates_range');

    this._initBinds();
    this._setToday();
  },

  render: function() {
    var self = this;

    this.clearSubViews();
    this.$el.empty();    

    this.$el.append(
      this.template(
        _.extend(
          this.model.attributes,
          { max_days: this._MAX_RANGE }
        )
      )
    );

    setTimeout(function() {
      self._initCalendar();
      self._hideCalendar();
      self._initTimers();
    }, 100);

    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_onDatesChange', '_onDocumentClick');

    this.model.bind('change', this._setValues, this);
    this.model.bind('change', this._onValuesChange, this);

    // Outside click
    $(document).bind('click', this._onDocumentClick);
  },

  _destroyBinds: function() {
    $(document).unbind('click', this._onDocumentClick);
  },

  _formattedDate: function (which) {
    return which + ' ' +
      '<strong>' +
        this.model.get(which + 'Date') + ' ' +
        (cdb.Utils.pad(this.model.get(which + 'Hour'), 2) + ':' + cdb.Utils.pad(this.model.get(which + 'Min'), 2)) +
      '</strong>';
  },

  _setValues: function() {
    var text = 'Choose your dates';
    var data = this.model.attributes;

    if (data.fromDate && data.toDate) {
      var calendarIcon = '<i class="CDB-IconFont CDB-IconFont-calendar DatePicker-datesIcon"></i>';
      text = this._formattedDate('from') + ' ' + this._formattedDate('to') + calendarIcon;
    }

    this.$('.DatePicker-dates').html(text);
  },

  _setToday: function() {
    var datesUTC = this.model.get('user_timezone');
    var today = moment().utc(datesUTC);
    var previous = moment().utc(datesUTC).subtract((this._MAX_RANGE - 1), 'days');
    this.options.date = [previous.format("YYYY-MM-DD"), today.format("YYYY-MM-DD")];
    this.options.current = today.format("YYYY-MM-DD");
    this._setModelFromPrevious(previous);
  },

  _initCalendar: function() {
    var selector = '.DatePicker-calendar';

    // Can't initialize calendar if not already present in document... avoid errors being thrown
    if (!document.body.contains(this.$(selector)[0])) return;

    this.calendar = this.$(selector).DatePicker(
      _.extend(this.options, {
        onChange: this._onDatesChange,
        onRender: function(d) { // Disable future dates and dates < 30 days ago

          var date = d.valueOf();
          var now = new Date();

          var thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);

          return (date < thirtyDaysAgo) || (date > now) ? { disabled: true } : ''

        }
      })
    );
  },

  _onDatesChange: function(formatted, dates) {

    // Check if selected dates have more than 30 days
    var start = moment(formatted[0]);
    var end = moment(formatted[1]);

    if (Math.abs(start.diff(end, 'days')) > this._MAX_RANGE) {
      formatted[1] = moment(formatted[0]).add('days', this._MAX_RANGE).format("YYYY-MM-DD");
      this.$('.DatePicker-calendar').DatePickerSetDate([formatted[0], formatted[1]]);
    }

    this.model.set({
      fromDate: formatted[0],
      toDate:   formatted[1]
    })
  },

  _hideCalendar: function(e) {
    if (e) this.killEvent(e);
    this.$('.DatePicker-dropdown').hide();
  },

  _toggleCalendar: function(ev) {
    if (ev) this.killEvent(ev);
    this.$('.DatePicker-dropdown').toggle();
  },

  _setPreviousTime: function (timeSpan) {
    var previous = moment().utc(0).subtract(timeSpan.amount, timeSpan.unit);
    this._setModelFromPrevious(previous);
    this._setDatepickerFromPrevious(previous);
    this.closeCalendar();
  },

  _setModelFromPrevious: function(previous) {
    var today = moment().utc(0);

    this.model.set({
      fromDate: previous.format('YYYY-MM-DD'),
      fromHour: parseInt(previous.format('H')),
      fromMin:  parseInt(previous.format('m')),
      toDate: today.format('YYYY-MM-DD'),
      toHour: parseInt(today.format('H')),
      toMin:  parseInt(today.format('m'))
    });
  },

  _setDatepickerFromPrevious: function(previous) {
    var today = moment().utc(0);    
    this.$('.DatePicker-calendar').DatePickerSetDate([ previous.format('YYYY-MM-DD') , today.format('YYYY-MM-DD') ]);
  },

  _initTimers: function() {
    // 'From' div
    var $from = this.$('.DatePicker-timersFrom');

    // From hour
    var fromHour = new Spinner({
      model:    this.model,
      property: 'fromHour',
      min:      0,
      max:      23,
      inc:      1,
      width:    15,
      pattern:  /^([12]?\d{0,1}|3[01]{0,2})$/,
      debounce_time: 0
    });

    $from.find('.DatePicker-timersHour').append(fromHour.render().el);
    this.addView(fromHour);

    // From min
    var fromMin = new Spinner({
      model:    this.model,
      property: 'fromMin',
      min:      0,
      max:      59,
      inc:      1,
      width:    15,
      pattern:  /^([12345]?\d{0,1})$/,
      debounce_time: 0
    });

    $from.find('.DatePicker-timersMin').append(fromMin.render().el);
    this.addView(fromMin);


    // 'To' div
    var $to = this.$('.DatePicker-timersTo');

    // To hour
    var toHour = new Spinner({
      model:    this.model,
      property: 'toHour',
      min:      0,
      max:      23,
      inc:      1,
      width:    15,
      pattern:  /^([12]?\d{0,1}|3[01]{0,2})$/,
      debounce_time: 0
    });

    $to.find('.DatePicker-timersHour').append(toHour.render().el);
    this.addView(toHour);

    // To min
    var toMin = new Spinner({
      model:    this.model,
      property: 'toMin',
      min:      0,
      max:      59,
      inc:      1,
      width:    15,
      pattern:  /^([12345]?\d{0,1})$/,
      debounce_time: 0
    });

    $to.find('.DatePicker-timersMin').append(toMin.render().el);
    this.addView(toMin);
  },

  _onValuesChange: function() {
    this.trigger('changeDate', this.model.toJSON(), this);
  },

  getDates: function() {
    return this.model.toJSON();
  },

  closeCalendar: function() {
    this.$('.DatePicker-dropdown').hide();
  },

  _onDocumentClick: function(e) {
    var $el = $(e.target);

    if ($el.closest('.DatePicker').length === 0) {
      this.closeCalendar();
    }
  },

  clean: function() {
    this._destroyBinds();
    this.closeCalendar();
    this.$('.DatePicker-calendar').DatePickerHide();
    cdb.core.View.prototype.clean.call(this);
  }

})
