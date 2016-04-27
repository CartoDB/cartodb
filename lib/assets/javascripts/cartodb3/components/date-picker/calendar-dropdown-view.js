var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var moment = require('moment');
var template = require('./calendar-dropdown.tpl');

/**
 * Dropdown for a calendar selector.
 * Uses the DatePicker plugin internally to render the calendar and view behaviour.
 */
module.exports = cdb.core.View.extend({
  className: 'Dropdown',

  // defaults, used for
  options: {
    flat: true,
    date: '2008-07-01',
    current: '2008-07-31',
    calendars: 1,
    starts: 1
  },

  initialize: function () {
    if (!this.model) throw new Error('model is required');
    this.elder('initialize');
    this._initDefaults();
  },

  render: function () {
    this.$el.html(
      template({
        initialDateStr: this.model.get('date')
      })
    );

    cdb.god.bind('closeDialogs', this.hide, this);
    $('body').append(this.el);
    this._initCalendar(); // must be called after element is added to body!

    return this;
  },

  _initDefaults: function () {
    var utc = new Date().getTimezoneOffset();
    var today = moment(new Date()).utcOffset(utc).format('YYYY-MM-DD');
    this.options.current = today;
    this.options.date = today;
  },

  // should not be called until element is located in document
  _initCalendar: function () {
    var self = this;
    this._$calendar().DatePicker(
      _.extend(this.options, this.model.attributes, {
        onChange: function (formatted) {
          self.model.set('date', formatted);
          self.$('.js-date-str').text(formatted);
          self.hide();
        }
      })
    );
  },

  _$calendar: function () {
    return this.$('.js-calendar');
  },

  clean: function () {
    this._$calendar().DatePickerHide();
    cdb.core.View.prototype.clean.call(this);
  }

});
