var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var moment = require('moment');

/**
 * Date picker for a single date.
 */
module.exports = cdb.core.View.extend({

  className: 'DatePicker',

  // defaults, used for
  options: {
    flat: true,
    date: '2008-07-01',
    current: '2008-07-31',
    calendars: 1,
    starts: 1
  },

  events: {
    'click .js-date': '_toggleCalendar'
  },

  initialize: function() {
    if (!this.model) throw new Error('model is required');
    this.elder('initialize');
    this._template = cdb.templates.getTemplate('common/views/date_pickers/date_picker');
    this._initBinds();
    this._initDefaults();
  },

  render: function() {
    this.clearSubViews();

    this.$el.append(
      this._template({
        initialDateStr: this.model.get('date')
      })
    );

    var self = this;
    setTimeout(function() {
      self._initCalendar();
    }, 100);

    return this;
  },

  closeCalendar: function() {
    this._$dropdown().hide();
  },

  clean: function() {
    this._destroyBinds();
    this.closeCalendar();
    this._$calendar().DatePickerHide();
    cdb.core.View.prototype.clean.call(this);
  },

  _initBinds: function() {
    _.bindAll(this, '_onDocumentClick');

    // Outside click
    $(document).bind('click', this._onDocumentClick);
  },

  _onDocumentClick: function(e) {
    var $el = $(e.target);

    if ($el.closest('.DatePicker').length === 0) {
      this.closeCalendar();
    }
  },

  _destroyBinds: function() {
    $(document).unbind('click', this._onDocumentClick);
  },

  _initDefaults: function() {
    var utc = new Date().getTimezoneOffset();
    var today = moment(new Date()).utcOffset(utc).format('YYYY-MM-DD');
    this.options.current = today;
    this.options.date = today;
  },

  // should not be called until element is located in document
  _initCalendar: function() {
    if (!document.body.contains(this._$calendar()[0])) return;

    var self = this;
    this._$calendar().DatePicker(
      _.extend(this.options, this.model.attributes, {
        onChange: function(formatted) {
          self.model.set('date', formatted);
          self.$('.js-date-str').text(formatted);
          self._toggleCalendar(); // effectively hides it
        }
      })
    );
  },

  _toggleCalendar: function(ev) {
    this.killEvent(ev);
    this._$dropdown().toggle();
  },

  _$dropdown: function() {
    return this.$('.DatePicker-dropdown');
  },

  _$calendar: function() {
    return this.$('.DatePicker-calendar');
  }

});
