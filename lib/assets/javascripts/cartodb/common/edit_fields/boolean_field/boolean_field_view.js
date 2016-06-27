var cdb = require('cartodb.js-v3');
var EditFieldView = require('../edit_field_view');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');

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
