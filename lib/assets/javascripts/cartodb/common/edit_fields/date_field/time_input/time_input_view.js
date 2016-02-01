var cdb = require('cartodb.js-v3');


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
    'keydown .js-input': '_onKeyDown',
    'keyup .js-input': '_onKeyUp'
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

  _onKeyDown: function(ev) {
    if (ev.keyCode === 13) {
      ev.preventDefault();
      this.trigger('onSubmit', this);
      return false;
    }
  },

  _onKeyUp: function(ev) {
    var value = $(ev.target).val();
    this.trigger('onTimeChange', value, this);
  }

})
