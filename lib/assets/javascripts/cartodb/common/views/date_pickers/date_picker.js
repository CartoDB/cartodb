var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var CalendarDropdown = require('./calendar_dropdown.js');

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
    tick: 'center'
  },

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/views/date_pickers/date_picker')({
        date: this.model.get('date')
      })
    );
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
      this._calendar.open();
    }
  },

  _destroyCalendarDropdown: function() {
    this._calendar.options.target.unbind('click', this._calendar._handleClick);
    this._calendar.clean();
    this._calendar = null;
  }
});
