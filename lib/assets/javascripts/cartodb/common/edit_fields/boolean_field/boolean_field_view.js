var cdb = require('cartodb.js');
var EditFieldView = require('../edit_field_view');
var _ = require('underscore');
var $ = require('jquery');

/**
 *  Boolean field
 *  
 *  Choosing between true, false or null
 *
 *  new BooleanFieldView({
 *    model: new EditFieldModel({ attribute: 'column', value: 'paco' }),
 *    option: false
 *  })
 */

module.exports = EditFieldView.extend({

  options: {
    template: 'common/edit_fields/boolean_field/boolean_field'
  },

  events: {
    'click .js-true': '_onTrueClick',
    'click .js-false': '_onFalseClick',
    'click .js-null': '_onNullClick'
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

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  _onTrueClick: function() {
    this.model.set('value', true);
  },

  _onFalseClick: function() {
    this.model.set('value', false);
  },

  _onNullClick: function() {
    this.model.set('value', null);
  }

})
