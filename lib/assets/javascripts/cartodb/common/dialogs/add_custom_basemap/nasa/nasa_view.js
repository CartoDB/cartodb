var cdb = require('cartodb.js');
var $ = require('jquery');
var DatePickerView = require('../../../views/date_pickers/date_picker.js');

/**
 * Represents the XYZ tab content.
 */
module.exports = cdb.core.View.extend({

  events: {
    'change input[type=radio]': '_onChangeDayOrNight'
  },

  render: function() {
    this.clearSubViews();

    var $el = $(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/nasa/nasa')({
      })
    );

    var datePickerView = this._createDatePicker();
    $el.find('.js-date-picker').append(datePickerView.render().el);

    this.$el.html($el);

    return this;
  },

  _createDatePicker: function() {
    var view = new DatePickerView({
      model: this.model
    });
    this.addView(view);
    return view;
  },

  _onChangeDayOrNight: function(ev) {
    this._enableDatePicker(ev.currentTarget.value === 'day');
  },

  _enableDatePicker: function(enable) {
    this._$datePicker()[ enable ? 'show' : 'hide' ]();
  },

  _$datePicker: function() {
    return this.$('.js-date-picker');
  }

});
