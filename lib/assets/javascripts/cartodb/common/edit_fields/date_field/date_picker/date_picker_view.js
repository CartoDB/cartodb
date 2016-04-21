var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var moment = require('moment-v3');
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
    dateFormat: 'YYYY-MM-DD'
  },

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    var date = this.model.get('value') || new Date();

    this.$el.html(
      cdb.templates.getTemplate('common/edit_fields/date_field/date_picker/date_picker')({
        readOnly: this.model.get('readOnly'),
        date: moment(date).format(this.options.dateFormat)
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
      this._calendar.on('onDateSelected', function(date) {
        this.trigger('onDateChange', date, this);
      }, this);
      this._calendar.open();
    }
  },

  _destroyCalendarDropdown: function() {
    this._calendar.options.target.unbind('click', this._calendar._handleClick);
    this._calendar.clean();
    this._calendar = null;
  }

});
