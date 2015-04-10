// var $ = require('jquery');
// var cdb = require('cartodb.js');

/**
 *  Editable text field
 */

module.exports = cdb.core.View.extend({

  events: {
    "keydown textarea": "_keyPressed"
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('new_common/views/editable_field');
    this.model = this.options.model;
    this.fieldName = this.options.fieldName;
    this.maxLength = this.options.maxLength || 255;
  },

  render: function() {
    var safeHTML = cdb.core.sanitize.html(markdown.toHTML(this.model.get(this.fieldName) || ''))
    var value = {
      safeHTML: safeHTML,
      clean: cdb.Utils.stripHTML(safeHTML)
    };
    this.$el.html(this.template({
      name: this.fieldName,
      value: value
    }));
    return this;
  },

  _keyPressed: function(event) {
    var escPressed = (event.keyCode == 27);
    var cmdEnterPressed = ((event.metaKey || event.ctrlKey) &&  event.keyCode == 13);
    var enterPressed = (event.keyCode == 13);
    var currentText = this.$('textarea').val();

    if (cmdEnterPressed) {
      event.preventDefault();
      this._addNewLine();
    } else if (enterPressed && currentText.trim() != '') {
      event.preventDefault();
      this._save();
    } else if (escPressed) {
      this._cancelEditing();
    } else if (currentText.length == this.maxLength) {
      event.preventDefault();
    }
  },

  _addNewLine: function() {
    this.$('textarea').val(this.$('textarea').val() + "\n");
    var attributes = {};
    attributes[this.fieldName] = this.$('textarea').val();
  },

  _save: function() {
    var attributes = {};
    attributes[this.fieldName] = this.$('textarea').val();
    this.model.save(attributes);
    this.render();
  },

  _cancelEditing: function() {
    this.$el.removeClass('is-editing');
    this.$('textarea').val(this.model.get(this.fieldName));
  }
});
