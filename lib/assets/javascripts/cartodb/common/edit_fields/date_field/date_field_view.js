var cdb = require('cartodb.js');
var EditFieldView = require('../edit_field_view');
var _ = require('underscore');
var $ = require('jquery');

/**
 *  Date field
 *  
 *  Place to change a date value
 *
 *  new DateFieldView({
 *    model: new NumberFieldModel({ attribute: 'column', value: 'paco' }),
 *    option: false
 *  })
 */

module.exports = EditFieldView.extend({

  options: {
    template: 'common/edit_fields/date_field/date_field',
    showTime: true,
    showGMT: false
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this.template({
        type: this.model.get('type'),
        value: this.model.get('value'),
        attribute: this.model.get('attribute'),
        readOnly: this.model.get('readOnly'),
        showTime: this.options.showTime,
        showGMT: this.options.showGMT
      })
    );

    this._initViews();

    return this;
  },

  _initViews: function() {
    // Date picker
     

    // Time input
    if (this.options.showTime) {

    }
  }

})
