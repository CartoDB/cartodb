var cdb = require('cartodb.js')
var template = require('./infowindow-field.tpl')

/**
 * View for an individual column model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-field',

  events: {
    'click .js-checkbox': 'toggle',
    'keyup input': '_onKeyUp',
    'blur input': '_onBlur',
  },

  initialize: function (opts) {
    this.fieldName = opts.field.name
    this.fieldTitle = opts.field.title
    this.position = opts.position

    this.model.bind('change:fields', this.render, this);
  },

  _onBlur: function (e) {
    console.log('blur')
  },

  _onKeyUp: function (e) {
    console.log('up')
  },

  render: function () {
    this.$el.html(template({
      name: this.fieldName,
      title: this.fieldTitle,
      alternativeName: this.model.getAlternativeName(this.fieldName),
      disabled: !this.fieldTitle,
      isSelected: !!this.model.containsField(this.fieldName)
    }))
    this.$el.attr('data-view-cid', this.cid)

    return this
  },

  toggle: function(e) {
    e.preventDefault();

    if (!this.model.containsField(this.fieldName)) {
      this.model.addField(this.fieldName, this.position);
    } else {
      this.model.removeField(this.fieldName);
    }

    return false;
  }

})