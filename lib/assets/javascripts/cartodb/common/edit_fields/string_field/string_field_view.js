var cdb = require('cartodb.js');
var EditFieldView = require('../edit_field_view');
var _ = require('underscore');
var $ = require('jquery');

/**
 *  String field
 *  
 *  Place to edit and capture string editions
 *  - It accepts a default model with {attribute: 'colum', value: 'hello'}.
 *
 *  new StringFieldView({
 *    model: new EditFieldModel({ attribute: 'column', value: 'paco' }),
 *    option: false
 *  })
 */

module.exports = EditFieldView.extend({

  options: {
    template: 'common/edit_fields/string_field/string_field',
    autoResize: true
  },

  events: {
    'keydown textarea':  '_onKeyDown'
  },

  render: function() {
    this.elder('render');

    // Hack to resize correctly the textarea
    if (this.options.autoResize) {
      this._resize();
    }

    return this;
  },

  _onKeyDown: function(ev) {
    if (this._hasSubmit(ev)) {
      ev.preventDefault();
      this.trigger('onSubmit', this.model, this);
      return false;
    }

    var value = $(ev.target).val();
    this.model.set('value', value);

    if (this.options.autoResize) {
      this._resize();
    }
  },

  // Hack function to resize automatially textarea
  _resize: function() {
    var $textarea = this.$(".js-textarea");

    // Hello hacky boy
    if ($textarea) {
      setTimeout(function() {
        $textarea.height(20);
        $textarea.height($textarea[0].scrollHeight - 22);
      });
    }
  }

})
