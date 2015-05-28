var cdb = require('cartodb.js');
var EditFieldView = require('../edit_field_view');
var _ = require('underscore');
var $ = require('jquery');

/**
 *  Number field
 *  
 *  Place to add/edit number editions
 *  - It accepts a number model with {attribute: 'colum', value: 'hello'}.
 *
 *  new NumberFieldView({
 *    model: new NumberFieldModel({ attribute: 'column', value: 'paco' }),
 *    option: false
 *  })
 */

module.exports = EditFieldView.extend({

  options: {
    template: 'common/edit_fields/number_field/number_field'
  },

  events: {
    'keydown .js-input': '_onKeyDown',
    'keyup .js-input': '_onKeyUp'
  },

  render: function() {
    this.$el.html(
      this.template({
        type: this.model.get('type'),
        value: this.model.get('value'),
        attribute: this.model.get('attribute'),
        readOnly: this.model.get('readOnly')
      })
    );

    if (this.options.readOnly) {
      this.undelegateEvents();
    }

    return this;
  },

  _onChange: function(ev) {
    var val = $(ev.target).val();
    this.model.set('value', val);
  },

  _hasSubmit: function(ev) {
    if (!ev) {
      throw new Error('event needed to check if user has submitted from the input');
    }
    return ev.keyCode === 13
  },

  _onKeyDown: function(ev) {
    if (this._hasSubmit(ev) && this.model.isValid()) {
      ev.preventDefault();
      this.trigger('onSubmit', this.model, this);
      return false;
    }
  },

  _onKeyUp: function(ev) {
    if (this._hasSubmit(ev) && this.model.isValid()) {
      ev.preventDefault();
      return false;
    }

    var value = $(ev.target).val();
    // Null values are valid for number type
    if (value === "") {
      value = null;
    }
    this.model.set('value', value);
  }

})
