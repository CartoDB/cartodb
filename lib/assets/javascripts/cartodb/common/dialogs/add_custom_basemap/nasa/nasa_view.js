var cdb = require('cartodb.js');
var DatePickerView = require('../../../views/date_pickers/date_picker.js');

/**
 * Represents the XYZ tab content.
 */
module.exports = cdb.core.View.extend({

  events: {
    'change input[type=radio]': '_onChangeType'
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/nasa/nasa')({
        initialDateStr: this.model.get('date')
      })
    );

    this._renderDatePicker();

    return this;
  },

  _renderDatePicker: function() {
    var view = new DatePickerView({
      model: this.model
    });
    this.addView(view);
    this._$datePicker().append(view.render().el);
  },

  _onChangeType: function(ev) {
    this.model.set('layerType', ev.currentTarget.value);
    this._enableDatePicker(ev.currentTarget.value === 'day');
  },

  _enableDatePicker: function(enable) {
    this._$datePicker()[ enable ? 'show' : 'hide' ]();
  },

  _$datePicker: function() {
    return this.$('.js-date-picker');
  }
});
