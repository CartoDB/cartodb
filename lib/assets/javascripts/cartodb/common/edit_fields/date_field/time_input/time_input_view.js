var cdb = require('cartodb.js');


/**
 *  Time input for date field
 *  
 *  Place to change hours, minutes and seconds
 *  for the date field.
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'keyup .js-input': '_onChange'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/edit_fields/date_field/time_input/time_input');
  },

  render: function() {
    var date = this.model.get('value') || new Date();
    this.$el.html(
      this.template({
        readOnly: this.model.get('readOnly'),
        time: moment(date).format('HH:mm:ss')
      })
    )

    if (this.model.get('readOnly')) {
      this.undelegateEvents();
    }

    return this;
  },

  _onChange: function(ev) {
    var value = $(ev.target).val();

    this._setTime(value);
  },

  _setTime: function(time) {
    var oldDate = moment(this.model.get('value'));
    var newDate = moment(new Date());
    var date;

    if (oldDate.isValid()) {
      oldDate
        .hours(newDate.hours())
        .minutes(newDate.minutes())
        .seconds(newDate.seconds());
      date = oldDate.format('YYYY-MM-DDT');
    } else {
      date = newDate.format('YYYY-MM-DDT');
    }

    this.model.set('value', date + time + 'Z');
  } 

})
