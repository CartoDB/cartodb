var cdb = require('cartodb.js-v3');
var EditFieldView = require('../edit_field_view');
var DatePickerView = require('./date_picker/date_picker_view');
var TimeInputView = require('./time_input/time_input_view');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');

/**
 *  Date field
 *  
 *  Place to change a date value
 *
 *  new DateFieldView({
 *    model: new EditFieldModel({ type: 'date', attribute: 'column', value: 'paco' }),
 *    option: false
 *  })
 */

module.exports = EditFieldView.extend({

  className: 'EditField EditField--withBorder EditField--withSeparator',

  options: {
    showTime: true,
    showGMT: false,
    timezone: 'Z' // In PostgreSQL 'Z' is the same as +00:00
  },

  render: function() {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initViews: function() {
    // Date picker
    this.datePicker = new DatePickerView({
      model: this.model
    });

    this.datePicker.bind('onDateChange', this._setDate, this);
    this.$el.append(this.datePicker.render().el);
    this.addView(this.datePicker);
     
    // Time input
    if (this.options.showTime) {
      this.timeInput = new TimeInputView({
        model: this.model
      });

      this.$el.append(this.timeInput.render().el);
      this.timeInput.bind('onTimeChange', this._setTime, this);
      this.timeInput.bind('onSubmit', function() {
        this.trigger('onSubmit', this.model, this);
      }, this);
      this.addView(this.timeInput);
    }
  },

  _setTime: function(time) {
    var oldDate = moment(this.model.get('value'));
    var newDate = moment(new Date());
    var date;

    if (oldDate.isValid()) {
      oldDate
        .hour(newDate.hour())
        .minutes(newDate.minutes())
        .seconds(newDate.seconds());
      date = oldDate.format('YYYY-MM-DDT');
    } else {
      date = newDate.format('YYYY-MM-DDT');
    }

    this.model.set('value', date + time + this.options.timezone);
  },

  _setDate: function(date) {
    var oldDate = moment(this.model.get('value'));
    var newDate = moment(date);
    var dateStr;

    if (oldDate.isValid()) {
      oldDate
        .month(newDate.month())
        .date(newDate.date())
        .year(newDate.year());
      dateStr = oldDate.format('YYYY-MM-DDTHH:mm:ss');
    } else {
      dateStr = newDate.format('YYYY-MM-DDTHH:mm:ss');
    }

    this.model.set('value', dateStr + this.options.timezone);
  }

})
