var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var moment = require('moment-v3');

/**
 * Dropdown for a calendar selector.
 * Uses the DatePicker plugin internally to render the calendar and view behaviour.
 */
module.exports = cdb.admin.DropdownMenu.extend({

  className: 'Dropdown',

  // defaults, used for
  options: {
    flat: true,
    date: '2008-07-01',
    current: '2008-07-31',
    calendars: 1,
    starts: 1
  },

  initialize: function() {
    if (!this.model) throw new Error('model is required');
    this.elder('initialize');
    this._template = cdb.templates.getTemplate('common/views/date_pickers/calendar_dropdown');
    this._initDefaults();
  },

  render: function() {
    this.$el.html(
      this._template({
        initialDateStr: this.model.get('date')
      })
    );

    cdb.god.bind('closeDialogs', this.hide, this);
    $('body').append(this.el);
    this._initCalendar(); // must be called after element is added to body!

    return this;
  },

  clean: function() {
    this._$calendar().DatePickerHide();
    cdb.admin.DropdownMenu.prototype.clean.call(this);
  },

  _initDefaults: function() {
    var utc = new Date().getTimezoneOffset();
    var today = moment(new Date()).utcOffset(utc).format('YYYY-MM-DD');
    this.options.current = today;
    this.options.date = today;
  },

  // should not be called until element is located in document
  _initCalendar: function() {
    var self = this;
    this._$calendar().DatePicker(
      _.extend(this.options, this.model.attributes, {
        onChange: function(formatted) {
          self.model.set('date', formatted);
          self.$('.js-date-str').text(formatted);
          self.hide();
        }
      })
    );
  },

  _$calendar: function() {
    return this.$('.js-calendar');
  }

});
