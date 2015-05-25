var cdb = require('cartodb.js');
var moment = require('moment');

/**
 * Represents the XYZ tab content.
 */
module.exports = cdb.core.View.extend({

  events: {
    'change input[type=radio]': '_onChangeDayOrNight'
  },

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/nasa/nasa')({
        todayDateStr: moment().format('YYYY-MM-DD')
      })
    );

    return this;
  },

  _onChangeDayOrNight: function(ev) {
    this._enableDatePicker(ev.currentTarget.value === 'day');
  },

  _enableDatePicker: function(enable) {
    this.$('.js-date-picker')[ enable ? 'show' : 'hide' ]();
  }

});
