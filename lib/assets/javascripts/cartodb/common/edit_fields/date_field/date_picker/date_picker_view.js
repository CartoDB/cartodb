var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var moment = require('moment');
var CalendarDropdown = require('./calendar_dropdown_view.js');

/**
 * Date picker for a single date.
 */
module.exports = cdb.admin.DropdownMenu.extend({

  className: 'DatePicker',

  events: {
    'click .js-date-picker': '_onClickDateBtn'
  },

  options: {
    vertical_position: 'down',
    tick: 'center',
    timezone: "00:00"
  },

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    var date = this.model.get('value') || new Date();

    this.$el.html(
      cdb.templates.getTemplate('common/edit_fields/date_field/date_picker/date_picker')({
        date: moment(date).format('YYYY-MM-DD')
      })
    );

    if (this.model.get('readOnly')) {
      this.undelegateEvents();
    }

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  _onClickDateBtn: function(ev) {
    this.killEvent(ev);

    // Behave like a toggle
    if (this._calendar) {
      this._destroyCalendarDropdown();
    } else {
      this._calendar = new CalendarDropdown(
        _.extend(this.options, {
          target: $(ev.target).closest('button'),
          model: this.model
        })
      );
      this.addView(this._calendar);
      this._calendar.render();
      this._calendar.on('onDropdownHidden', this._destroyCalendarDropdown, this);
      this._calendar.on('onDateSelected', this._setDate, this);
      this._calendar.open();
    }
  },

  _destroyCalendarDropdown: function() {
    this._calendar.options.target.unbind('click', this._calendar._handleClick);
    this._calendar.clean();
    this._calendar = null;
  },

  _setDate: function(date) {
    var oldDate = moment(this.model.get('value'));
    var newDate = moment(date);
    var date;

    if (oldDate.isValid()) {
      oldDate
        .month(newDate.month())
        .day(newDate.day())
        .year(newDate.year());
      date = oldDate.format('YYYY-MM-DDTHH:mm:ssZ');
    } else {
      date = newDate.format('YYYY-MM-DDTHH:mm:ssZ');
    }

    this.model.set('value', date);
  }

});
