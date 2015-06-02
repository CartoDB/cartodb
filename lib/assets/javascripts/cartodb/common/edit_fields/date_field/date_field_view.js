var cdb = require('cartodb.js');
var EditFieldView = require('../edit_field_view');
var DatePickerView = require('./date_picker/date_picker_view');
var TimeInputView = require('./time_input/time_input_view');
var _ = require('underscore');
var $ = require('jquery');

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

  className: 'EditField EditField--withBorder',

  options: {
    template: 'common/edit_fields/date_field/date_field',
    showTime: true,
    showGMT: false
  },

  render: function() {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initViews: function() {
    // Date picker
    var datePicker = new DatePickerView({
      model: this.model
    });

    this.$el.append(datePicker.render().el);
    this.addView(datePicker);
     
    // Time input
    if (this.options.showTime) {
      var timeInput = new TimeInputView({
        model: this.model
      });

      this.$el.append(timeInput.render().el);
      this.addView(timeInput);
    }
  }

})
