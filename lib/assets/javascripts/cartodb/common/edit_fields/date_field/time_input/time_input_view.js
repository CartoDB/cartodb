var cdb = require('cartodb.js');


/**
 *  Time input for date field
 *  
 *  Place to change hours, minutes and seconds
 *  for the date field.
 *
 */

module.exports = cdb.core.View.extend({

  className: 'TimeInput',

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
    this.trigger('onTimeChange', value, this);
  }
})
